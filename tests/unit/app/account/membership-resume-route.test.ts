import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSessionUserMock = vi.fn();
const resumeMembershipCancellationMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/lib/membership/membership-service", () => ({
  resumeMembershipCancellation: resumeMembershipCancellationMock,
}));

const route = await import("@/app/api/me/membership/resume/route");

describe("POST /api/me/membership/resume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    resumeMembershipCancellationMock.mockResolvedValue({
      id: "membership_123",
      cancelAtPeriodEnd: false,
    });
  });

  it("resumes a scheduled membership cancellation", async () => {
    const response = await route.POST();

    expect(response.status).toBe(200);
    expect(resumeMembershipCancellationMock).toHaveBeenCalledWith("user_123");
  });

  it("returns 404 when there is no membership to resume", async () => {
    resumeMembershipCancellationMock.mockRejectedValue(new Error("MEMBERSHIP_NOT_FOUND"));

    const response = await route.POST();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: "Membership not found." });
  });
});
