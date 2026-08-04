import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const connectionMock = vi.fn();
const getMyRetreatGiftPurchasesMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, connection: connectionMock };
});

vi.mock("@/lib/auth", () => ({ auth: authMock }));

vi.mock("@/lib/gifts/service", () => ({
  getMyRetreatGiftPurchases: getMyRetreatGiftPurchasesMock,
}));

const route = await import("@/app/api/me/retreat-gifts/route");

describe("signed-in retreat gift purchases route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    authMock.mockResolvedValue({ user: { id: "user_1", role: "user" } });
  });

  it("returns gift delivery and redemption state for the purchaser", async () => {
    getMyRetreatGiftPurchasesMock.mockResolvedValue([
      { id: "gift_1", status: "purchased", recipientEmail: "recipient@example.com" },
    ]);

    const response = await route.GET(
      new Request("http://localhost/api/me/retreat-gifts", { method: "GET" })
    );

    expect(response.status).toBe(200);
    expect(getMyRetreatGiftPurchasesMock).toHaveBeenCalledWith("user_1");
  });

  it("requires an authenticated purchaser", async () => {
    authMock.mockResolvedValue(null);

    const response = await route.GET(
      new Request("http://localhost/api/me/retreat-gifts", { method: "GET" })
    );

    expect(response.status).toBe(401);
    expect(getMyRetreatGiftPurchasesMock).not.toHaveBeenCalled();
  });
});
