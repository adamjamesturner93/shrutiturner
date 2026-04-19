import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const cancelMembershipMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/membership/membership-service", () => ({
  cancelMembership: cancelMembershipMock,
}));

const route = await import("@/app/api/me/membership/cancel/route");

describe("POST /api/me/membership/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    cancelMembershipMock.mockResolvedValue({ id: "membership_123", cancelAtPeriodEnd: true });
  });

  it("cancels the current member subscription", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/me/membership/cancel", { method: "POST" })
    );

    expect(response.status).toBe(200);
    expect(cancelMembershipMock).toHaveBeenCalledWith("user_123");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { membership: { id: "membership_123", cancelAtPeriodEnd: true } },
    });
  });

  it("returns 401 when the member is unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await route.POST(
      new Request("http://localhost/api/me/membership/cancel", { method: "POST" })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
  });

  it("returns 503 when Stripe is not configured", async () => {
    cancelMembershipMock.mockRejectedValue(new Error("STRIPE_NOT_CONFIGURED"));

    const response = await route.POST(
      new Request("http://localhost/api/me/membership/cancel", { method: "POST" })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "SERVICE_UNAVAILABLE", message: "Stripe is not configured." },
    });
  });
});
