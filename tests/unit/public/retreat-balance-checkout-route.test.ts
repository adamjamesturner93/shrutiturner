import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const createRetreatBalanceCheckoutMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/retreats/service", () => ({
  createRetreatBalanceCheckout: createRetreatBalanceCheckoutMock,
}));

const route = await import("@/app/api/retreats/bookings/[id]/balance-checkout/route");

function request() {
  return new Request("http://localhost/api/retreats/bookings/booking_123/balance-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "balance_token" }),
  });
}

describe("POST /api/retreats/bookings/[id]/balance-checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(null);
  });

  it("blocks payment when the original booking has incomplete agreement evidence", async () => {
    createRetreatBalanceCheckoutMock.mockRejectedValue(
      new Error("ORIGINAL_ACCEPTANCE_EVIDENCE_MISSING")
    );

    const response = await route.POST(request(), {
      params: Promise.resolve({ id: "booking_123" }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: "ORIGINAL_ACCEPTANCE_EVIDENCE_MISSING",
      message:
        "We could not verify the agreement records from the original booking. Contact Shruti before making this payment.",
    });
  });
});
