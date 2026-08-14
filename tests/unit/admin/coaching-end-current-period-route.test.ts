import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const stopCoachingRenewalAtCurrentPeriodEndMock = vi.fn();
const createAdminActionLogMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/billing/billing-service", () => ({
  stopCoachingRenewalAtCurrentPeriodEnd: stopCoachingRenewalAtCurrentPeriodEndMock,
}));

vi.mock("@/lib/admin/action-log-service", () => ({
  createAdminActionLog: createAdminActionLogMock,
}));

const route = await import("@/app/api/admin/coaching/subscriptions/end-current-period/route");

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/coaching/subscriptions/end-current-period", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/coaching/subscriptions/end-current-period", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "admin_123", role: "admin" } });
    stopCoachingRenewalAtCurrentPeriodEndMock.mockResolvedValue({
      subscriptionId: "sub_123",
      endsAt: "2026-09-01T00:00:00.000Z",
    });
  });

  it("stops renewal and records the admin reason", async () => {
    const response = await route.POST(
      request({ userId: "user_123", reason: "Agreed health-related exception." })
    );

    expect(response.status).toBe(200);
    expect(stopCoachingRenewalAtCurrentPeriodEndMock).toHaveBeenCalledWith("user_123");
    expect(createAdminActionLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_123",
        actionType: "coaching_subscription_future_payments_stopped",
        targetId: "user_123",
        newValueJson: expect.objectContaining({
          reason: "Agreed health-related exception.",
        }),
      })
    );
  });

  it("requires an auditable reason", async () => {
    const response = await route.POST(request({ userId: "user_123", reason: "no" }));

    expect(response.status).toBe(400);
    expect(stopCoachingRenewalAtCurrentPeriodEndMock).not.toHaveBeenCalled();
  });
});
