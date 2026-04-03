import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSessionUserMock = vi.fn();
const createMembershipCheckoutSessionMock = vi.fn();
const recordSubscriptionComplianceEventMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/lib/billing/billing-service", () => ({
  createMembershipCheckoutSession: createMembershipCheckoutSessionMock,
}));

vi.mock("@/lib/billing/subscription-disclosure", () => ({
  SUBSCRIPTION_DISCLOSURE_VERSION: "2026-04-03",
}));

vi.mock("@/lib/billing/subscription-compliance", () => ({
  recordSubscriptionComplianceEvent: recordSubscriptionComplianceEventMock,
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
      })
    );
  });
});
