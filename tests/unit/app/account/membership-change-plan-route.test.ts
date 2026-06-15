import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const changeMembershipPlanMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/membership/membership-service", () => ({
  changeMembershipPlan: changeMembershipPlanMock,
}));

const route = await import("@/app/api/me/membership/change-plan/route");

describe("POST /api/me/membership/change-plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    changeMembershipPlanMock.mockResolvedValue({
      membership: { id: "membership_123", billingInterval: "annual" },
      mode: "immediate",
    });
  });

  it("changes a member subscription through the Stripe-backed service", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/me/membership/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "movewell", billingInterval: "annual" }),
      })
    );

    expect(response.status).toBe(200);
    expect(changeMembershipPlanMock).toHaveBeenCalledWith({
      userId: "user_123",
      plan: "movewell",
      billingInterval: "annual",
    });
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        membership: { id: "membership_123", billingInterval: "annual" },
        mode: "immediate",
      },
    });
  });

  it("rejects invalid billing intervals", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/me/membership/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "movewell", billingInterval: "weekly" }),
      })
    );

    expect(response.status).toBe(400);
    expect(changeMembershipPlanMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "BAD_REQUEST", message: "Invalid billing interval." },
    });
  });

  it("returns 503 when Stripe subscription management is unavailable", async () => {
    changeMembershipPlanMock.mockRejectedValue(new Error("STRIPE_PRICE_NOT_CONFIGURED"));

    const response = await route.POST(
      new Request("http://localhost/api/me/membership/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "movewell", billingInterval: "annual" }),
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Stripe subscription management is not configured.",
      },
    });
  });

  it("requires an authenticated member", async () => {
    authMock.mockResolvedValue(null);

    const response = await route.POST(
      new Request("http://localhost/api/me/membership/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "movewell", billingInterval: "annual" }),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
  });
});
