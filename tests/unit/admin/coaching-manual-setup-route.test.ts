import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminUserMock = vi.fn();
const updateCoachingProfileManualSetupStatusMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/coaching/service", () => ({
  updateCoachingProfileManualSetupStatus: updateCoachingProfileManualSetupStatusMock,
}));

const route = await import("@/app/api/admin/coaching/profiles/manual-setup/route");

describe("PATCH /api/admin/coaching/profiles/manual-setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123" });
    updateCoachingProfileManualSetupStatusMock.mockResolvedValue({
      id: "profile_123",
      everfitConnectionStatus: "closed",
    });
  });

  it("lets admin record that manual Everfit access has been closed", async () => {
    const response = await route.PATCH(
      new Request("http://localhost/api/admin/coaching/profiles/manual-setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: "profile_123",
          everfitConnectionStatus: "closed",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(updateCoachingProfileManualSetupStatusMock).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: "profile_123",
        everfitConnectionStatus: "closed",
        actorUserId: "admin_123",
      })
    );
  });
});
