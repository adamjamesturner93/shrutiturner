import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminUserMock = vi.fn();
const listAdminCoachingApplicationsMock = vi.fn();
const updateAdminCoachingApplicationMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/coaching/service", () => ({
  listAdminCoachingApplications: listAdminCoachingApplicationsMock,
  updateAdminCoachingApplication: updateAdminCoachingApplicationMock,
}));

const route = await import("@/app/api/admin/coaching/applications/route");

function patchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/coaching/applications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/admin/coaching/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123" });
    updateAdminCoachingApplicationMock.mockResolvedValue({ id: "application_123" });
  });

  it("passes a client-facing decision reason to the coaching application service", async () => {
    const response = await route.PATCH(
      patchRequest({
        id: "application_123",
        status: "approved",
        adminNotes: "Internal note",
        decisionReason: "This looks like the right support level.",
      })
    );

    expect(response.status).toBe(200);
    expect(updateAdminCoachingApplicationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "application_123",
        status: "approved",
        adminNotes: "Internal note",
        decisionReason: "This looks like the right support level.",
        actorUserId: "admin_123",
      })
    );
  });

  it("accepts the waitlisted status for capacity decisions", async () => {
    const response = await route.PATCH(
      patchRequest({
        id: "application_123",
        status: "waitlisted",
        decisionReason: "I would like to offer a place when capacity opens.",
      })
    );

    expect(response.status).toBe(200);
    expect(updateAdminCoachingApplicationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "application_123",
        status: "waitlisted",
        decisionReason: "I would like to offer a place when capacity opens.",
      })
    );
  });

  it("returns a clear error when rejection is missing a client-facing reason", async () => {
    updateAdminCoachingApplicationMock.mockRejectedValue(new Error("DECISION_REASON_REQUIRED"));

    const response = await route.PATCH(
      patchRequest({
        id: "application_123",
        status: "declined",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Add a client-facing reason before rejecting this application.",
    });
  });
});
