import { describe, expect, it, vi, beforeEach } from "vitest";

const requireSessionUserMock = vi.fn();
const assertCurrentAcceptancesMock = vi.fn();
const isAcceptanceRequiredErrorMock = vi.fn();
const createCoachingCheckoutSessionMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/lib/legal/acceptance-service", () => ({
  assertCurrentAcceptances: assertCurrentAcceptancesMock,
  isAcceptanceRequiredError: isAcceptanceRequiredErrorMock,
}));

vi.mock("@/lib/billing/billing-service", () => ({
  createCoachingCheckoutSession: createCoachingCheckoutSessionMock,
}));

const route = await import("@/app/api/me/coaching/checkout/route");

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/me/coaching/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/me/coaching/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    assertCurrentAcceptancesMock.mockResolvedValue([]);
    isAcceptanceRequiredErrorMock.mockReturnValue(false);
    createCoachingCheckoutSessionMock.mockResolvedValue({
      checkoutUrl: "https://checkout.stripe.com/session",
      sessionId: "cs_123",
    });
  });

  it("requires current terms and health waiver acceptance before checkout", async () => {
    await route.POST(request({ applicationId: "application_123" }));

    expect(assertCurrentAcceptancesMock).toHaveBeenCalledWith("user_123", [
      { type: "terms", surface: "coaching_checkout" },
      { type: "health_waiver", surface: "coaching_checkout" },
    ]);
    expect(createCoachingCheckoutSessionMock).toHaveBeenCalledWith(
      "user_123",
      "application_123",
      expect.objectContaining({
        successPath: "/dashboard/coaching?checkout=success",
        cancelPath: "/dashboard/coaching?checkout=cancelled",
      })
    );
  });

  it("returns required acceptance details when checkout legal acceptance is stale", async () => {
    const acceptanceError = {
      message: "LEGAL_ACCEPTANCE_REQUIRED",
      details: {
        code: "LEGAL_ACCEPTANCE_REQUIRED",
        requiredAcceptances: [{ type: "terms", surface: "coaching_checkout" }],
      },
    };
    assertCurrentAcceptancesMock.mockRejectedValue(acceptanceError);
    isAcceptanceRequiredErrorMock.mockImplementation((error) => error === acceptanceError);

    const response = await route.POST(request({ applicationId: "application_123" }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: "Current legal acceptance is required before coaching checkout.",
      details: acceptanceError.details,
    });
    expect(createCoachingCheckoutSessionMock).not.toHaveBeenCalled();
  });
});
