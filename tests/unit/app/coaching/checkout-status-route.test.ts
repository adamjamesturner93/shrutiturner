import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getCoachingCheckoutReturnStateMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/billing/billing-service", () => ({
  getCoachingCheckoutReturnState: getCoachingCheckoutReturnStateMock,
}));

const route = await import("@/app/api/me/coaching/checkout-status/route");

describe("GET /api/me/coaching/checkout-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    getCoachingCheckoutReturnStateMock.mockResolvedValue({
      status: "paid",
      amountPence: 13000,
      currency: "GBP",
      invoiceUrl: "https://invoice.stripe.com/in_123",
    });
  });

  it("returns a verified coaching payment owned by the signed-in user", async () => {
    const response = await route.GET(
      new Request("http://localhost/api/me/coaching/checkout-status?sessionId=cs_123")
    );

    expect(response.status).toBe(200);
    expect(getCoachingCheckoutReturnStateMock).toHaveBeenCalledWith("user_123", "cs_123");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        status: "paid",
        amountPence: 13000,
        currency: "GBP",
        invoiceUrl: "https://invoice.stripe.com/in_123",
      },
    });
  });

  it("does not disclose a checkout owned by another user", async () => {
    getCoachingCheckoutReturnStateMock.mockRejectedValue(new Error("COACHING_CHECKOUT_NOT_FOUND"));

    const response = await route.GET(
      new Request("http://localhost/api/me/coaching/checkout-status?sessionId=cs_other")
    );

    expect(response.status).toBe(404);
  });
});
