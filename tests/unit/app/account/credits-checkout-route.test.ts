import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const createCreditCheckoutSessionMock = vi.fn();
const assertNoUserCheckoutDisputeHoldMock = vi.fn();
const assertCurrentAcceptancesMock = vi.fn();
const isAcceptanceRequiredErrorMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/billing/billing-service", () => ({
  createCreditCheckoutSession: createCreditCheckoutSessionMock,
}));
vi.mock("@/lib/billing/dispute-service", () => ({
  assertNoUserCheckoutDisputeHold: assertNoUserCheckoutDisputeHoldMock,
}));
vi.mock("@/lib/legal/acceptance-service", () => ({
  assertCurrentAcceptances: assertCurrentAcceptancesMock,
  isAcceptanceRequiredError: isAcceptanceRequiredErrorMock,
}));

const route = await import("@/app/api/me/credits/checkout/route");

function request() {
  return new Request("http://localhost/api/me/credits/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bundleSize: 3 }),
  });
}

describe("POST /api/me/credits/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    assertNoUserCheckoutDisputeHoldMock.mockResolvedValue(undefined);
    assertCurrentAcceptancesMock.mockResolvedValue([]);
    isAcceptanceRequiredErrorMock.mockReturnValue(false);
    createCreditCheckoutSessionMock.mockResolvedValue({
      checkoutUrl: "https://checkout.stripe.com/credits",
    });
  });

  it("checks current terms and health waiver before creating Stripe checkout", async () => {
    const response = await route.POST(request());

    expect(response.status).toBe(200);
    expect(assertCurrentAcceptancesMock).toHaveBeenCalledWith("user_123", [
      { type: "terms", surface: "credit_checkout" },
      { type: "health_waiver", surface: "credit_checkout" },
    ]);
    expect(createCreditCheckoutSessionMock).toHaveBeenCalled();
  });

  it("does not call Stripe when agreement evidence is missing", async () => {
    const acceptanceError = {
      details: {
        code: "LEGAL_ACCEPTANCE_REQUIRED",
        requiredAcceptances: [{ type: "terms", surface: "credit_checkout" }],
      },
    };
    assertCurrentAcceptancesMock.mockRejectedValue(acceptanceError);
    isAcceptanceRequiredErrorMock.mockImplementation((error) => error === acceptanceError);

    const response = await route.POST(request());

    expect(response.status).toBe(409);
    expect(createCreditCheckoutSessionMock).not.toHaveBeenCalled();
  });
});
