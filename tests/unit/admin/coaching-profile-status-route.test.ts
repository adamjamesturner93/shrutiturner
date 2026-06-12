import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminUserMock = vi.fn();
const updateCoachingProfileStatusMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/coaching/service", () => ({
  updateCoachingProfileStatus: updateCoachingProfileStatusMock,
}));

const route = await import("@/app/api/admin/coaching/profiles/status/route");

function patchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/coaching/profiles/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/admin/coaching/profiles/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123" });
    updateCoachingProfileStatusMock.mockResolvedValue({
      id: "profile_123",
      status: "active",
    });
  });

  it("lets admin mark an onboarding coaching profile active", async () => {
    const response = await route.PATCH(
      patchRequest({
        profileId: "profile_123",
        status: "active",
      })
    );

    expect(response.status).toBe(200);
    expect(updateCoachingProfileStatusMock).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: "profile_123",
        status: "active",
        actorUserId: "admin_123",
      })
    );
  });
});
