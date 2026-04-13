import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSessionUserMock = vi.fn();
const createMembershipCheckoutSessionMock = vi.fn();
const assertNoUserCheckoutDisputeHoldMock = vi.fn();
const recordSubscriptionComplianceEventMock = vi.fn();
const assertCurrentAcceptancesMock = vi.fn();
const recordAcceptanceEventMock = vi.fn();
const isAcceptanceRequiredErrorMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/lib/billing/billing-service", () => ({
  createMembershipCheckoutSession: createMembershipCheckoutSessionMock,
}));

vi.mock("@/lib/billing/dispute-service", () => ({
  assertNoUserCheckoutDisputeHold: assertNoUserCheckoutDisputeHoldMock,
}));

vi.mock("@/lib/billing/subscription-disclosure", () => ({
  SUBSCRIPTION_DISCLOSURE_VERSION: "2026-04-03",
}));

vi.mock("@/lib/billing/subscription-compliance", () => ({
  recordSubscriptionComplianceEvent: recordSubscriptionComplianceEventMock,
}));

vi.mock("@/lib/legal/acceptance-service", () => ({
  assertCurrentAcceptances: assertCurrentAcceptancesMock,
  recordAcceptanceEvent: recordAcceptanceEventMock,
  isAcceptanceRequiredError: isAcceptanceRequiredErrorMock,
}));

const route = await import("@/app/api/me/membership/checkout/route");

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/me/membership/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/me/membership/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    assertNoUserCheckoutDisputeHoldMock.mockResolvedValue(undefined);
    assertCurrentAcceptancesMock.mockResolvedValue([
      {
        type: "terms",
        surface: "membership_checkout",
        currentVersion: "terms.v1",
        acceptedVersion: "terms.v1",
        policyVersionId: "policy_terms_v1",
        acceptanceEventId: "event_terms_v1",
        isCurrent: true,
      },
      {
        type: "health_waiver",
        surface: "membership_checkout",
        currentVersion: "health-waiver.v1",
        acceptedVersion: "health-waiver.v1",
        policyVersionId: "policy_health_waiver_v1",
        acceptanceEventId: "event_health_waiver_v1",
        isCurrent: true,
      },
    ]);
    recordAcceptanceEventMock.mockResolvedValue({ id: "event_immediate_start_v1" });
    isAcceptanceRequiredErrorMock.mockReturnValue(false);
    createMembershipCheckoutSessionMock.mockResolvedValue({
      checkoutUrl: "https://checkout.stripe.com/session",
      sessionId: "cs_test_123",
      discountPence: 0,
      discountSource: "none",
    });
    recordSubscriptionComplianceEventMock.mockResolvedValue(undefined);
  });

  it("rejects checkout when the disclosure has not been acknowledged", async () => {
    const response = await route.POST(
      createRequest({
        plan: "movewell",
        billingInterval: "monthly",
        disclosureAccepted: false,
        disclosureVersion: "2026-04-03",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Subscription terms must be acknowledged before checkout.",
    });
    expect(createMembershipCheckoutSessionMock).not.toHaveBeenCalled();
    expect(assertNoUserCheckoutDisputeHoldMock).toHaveBeenCalledWith("user_123");
  });

  it("rejects checkout when the disclosure version is stale", async () => {
    const response = await route.POST(
      createRequest({
        plan: "movewell",
        billingInterval: "monthly",
        disclosureAccepted: true,
        disclosureVersion: "2026-01-01",
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: "Subscription disclosure is out of date. Refresh and review it again.",
    });
    expect(recordSubscriptionComplianceEventMock).not.toHaveBeenCalled();
    expect(createMembershipCheckoutSessionMock).not.toHaveBeenCalled();
    expect(assertNoUserCheckoutDisputeHoldMock).toHaveBeenCalledWith("user_123");
  });

  it("records disclosure acceptance before creating checkout", async () => {
    const response = await route.POST(
      createRequest({
        plan: "movewell",
        billingInterval: "annual",
        promotionCode: "MOVEWELL",
        successPath: "/dashboard/membership?checkout=success",
        cancelPath: "/dashboard/membership",
        disclosureAccepted: true,
        disclosureVersion: "2026-04-03",
      })
    );

    expect(response.status).toBe(200);
    expect(assertCurrentAcceptancesMock).toHaveBeenCalledWith("user_123", [
      { type: "terms", surface: "membership_checkout" },
      { type: "health_waiver", surface: "membership_checkout" },
    ]);
    expect(recordAcceptanceEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_123",
        actorUserId: "user_123",
        type: "immediate_start",
        surface: "membership_checkout",
      })
    );
    expect(recordSubscriptionComplianceEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_123",
        kind: "disclosure_acknowledged",
        status: "recorded",
      })
    );
    expect(createMembershipCheckoutSessionMock).toHaveBeenCalledWith(
      "user_123",
      "movewell",
      "annual",
      "MOVEWELL",
      "movewell",
      expect.objectContaining({
        successPath: "/dashboard/membership?checkout=success",
        cancelPath: "/dashboard/membership",
        disclosureVersion: "2026-04-03",
        disclosureAcceptedAt: expect.any(Date),
        complianceSnapshot: {
          acceptanceStates: [
            {
              type: "terms",
              policyVersionId: "policy_terms_v1",
              acceptanceEventId: "event_terms_v1",
              version: "terms.v1",
              surface: "membership_checkout",
            },
            {
              type: "health_waiver",
              policyVersionId: "policy_health_waiver_v1",
              acceptanceEventId: "event_health_waiver_v1",
              version: "health-waiver.v1",
              surface: "membership_checkout",
            },
          ],
          immediateStartAcceptanceEventId: "event_immediate_start_v1",
        },
      })
    );
    expect(assertNoUserCheckoutDisputeHoldMock).toHaveBeenCalledWith("user_123");
  });

  it("returns a structured re-acceptance response when a required acceptance is stale", async () => {
    const requiredAcceptances = [
      {
        type: "terms",
        surface: "membership_checkout",
        currentVersion: "terms.v2",
        acceptedVersion: "terms.v1",
        policyVersionId: "policy_terms_v2",
        acceptanceEventId: "event_terms_v1",
        isCurrent: false,
      },
    ];
    const acceptanceError = {
      message: "LEGAL_ACCEPTANCE_REQUIRED",
      details: {
        code: "LEGAL_ACCEPTANCE_REQUIRED",
        requiredAcceptances,
      },
    };
    assertCurrentAcceptancesMock.mockRejectedValue(acceptanceError);
    isAcceptanceRequiredErrorMock.mockImplementation(
      (error) => error === acceptanceError || error?.message === "LEGAL_ACCEPTANCE_REQUIRED"
    );

    const response = await route.POST(
      createRequest({
        plan: "movewell",
        billingInterval: "monthly",
        disclosureAccepted: true,
        disclosureVersion: "2026-04-03",
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: "LEGAL_ACCEPTANCE_REQUIRED",
      requiredAcceptances,
    });
    expect(recordAcceptanceEventMock).not.toHaveBeenCalled();
    expect(createMembershipCheckoutSessionMock).not.toHaveBeenCalled();
    expect(assertNoUserCheckoutDisputeHoldMock).toHaveBeenCalledWith("user_123");
  });
});
