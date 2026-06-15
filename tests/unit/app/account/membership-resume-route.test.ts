import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const resumeMembershipCancellationMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/membership/membership-service", () => ({
  resumeMembershipCancellation: resumeMembershipCancellationMock,
}));

const route = await import("@/app/api/me/membership/resume/route");

describe("POST /api/me/membership/resume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123", role: "member" } });
    resumeMembershipCancellationMock.mockResolvedValue({
      id: "membership_123",
      cancelAtPeriodEnd: false,
    });
  });

  it("resumes a scheduled membership cancellation", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/me/membership/resume", { method: "POST" })
    );

    expect(response.status).toBe(200);
    expect(resumeMembershipCancellationMock).toHaveBeenCalledWith("user_123");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { membership: { id: "membership_123", cancelAtPeriodEnd: false } },
    });
  });

  it("returns 404 when there is no membership to resume", async () => {
    resumeMembershipCancellationMock.mockRejectedValue(new Error("MEMBERSHIP_NOT_FOUND"));

    const response = await route.POST(
      new Request("http://localhost/api/me/membership/resume", { method: "POST" })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Membership not found." },
    });
  });
});
