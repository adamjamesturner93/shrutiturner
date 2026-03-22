import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSessionUserMock = vi.fn();
const cancelMembershipMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/lib/membership/membership-service", () => ({
  cancelMembership: cancelMembershipMock,
}));

const route = await import("@/app/api/me/membership/cancel/route");

describe("POST /api/me/membership/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    cancelMembershipMock.mockResolvedValue({ id: "membership_123", cancelAtPeriodEnd: true });
  });

  it("cancels the current member subscription", async () => {
    const response = await route.POST();

    expect(response.status).toBe(200);
    expect(cancelMembershipMock).toHaveBeenCalledWith("user_123");
  });

  it("returns 401 when the member is unauthenticated", async () => {
    requireSessionUserMock.mockRejectedValue(new Error("UNAUTHORIZED"));

    const response = await route.POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });

  it("returns 501 when Stripe is not configured", async () => {
    cancelMembershipMock.mockRejectedValue(new Error("STRIPE_NOT_CONFIGURED"));

    const response = await route.POST();

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({ message: "Stripe is not configured." });
  });
});
