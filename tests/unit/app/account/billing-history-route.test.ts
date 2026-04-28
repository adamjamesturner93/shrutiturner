import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getBillingHistoryMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    connection: vi.fn(async () => {}),
  };
});

vi.mock("@/lib/billing/history-service", () => ({
  getBillingHistory: getBillingHistoryMock,
}));

const route = await import("@/app/api/me/billing-history/route");

describe("GET /api/me/billing-history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    getBillingHistoryMock.mockResolvedValue([
      {
        id: "invoice_123",
        createdAt: "2026-04-28T07:00:00.000Z",
        kind: "membership_charge",
        description: "Membership payment",
        amountPence: 2900,
        status: "paid",
        invoiceUrl: "https://pay.stripe.com/invoice/acct/inv_123",
      },
    ]);
  });

  it("returns billing history for the authenticated member", async () => {
    const response = await route.GET(
      new Request("http://localhost/api/me/billing-history?limit=30")
    );

    expect(response.status).toBe(200);
    expect(getBillingHistoryMock).toHaveBeenCalledWith("user_123", 30);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: [
        {
          id: "invoice_123",
          createdAt: "2026-04-28T07:00:00.000Z",
          kind: "membership_charge",
          description: "Membership payment",
          amountPence: 2900,
          status: "paid",
          invoiceUrl: "https://pay.stripe.com/invoice/acct/inv_123",
        },
      ],
    });
  });

  it("clamps lazy-load limits to the supported range", async () => {
    await route.GET(new Request("http://localhost/api/me/billing-history?limit=3"));
    expect(getBillingHistoryMock).toHaveBeenLastCalledWith("user_123", 10);

    await route.GET(new Request("http://localhost/api/me/billing-history?limit=500"));
    expect(getBillingHistoryMock).toHaveBeenLastCalledWith("user_123", 100);
  });

  it("requires authentication", async () => {
    authMock.mockResolvedValue(null);

    const response = await route.GET(new Request("http://localhost/api/me/billing-history"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
  });
});
