import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminUserMock = vi.fn();
const generateDraftSessionsForActiveClassTimetablesMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/classes/timetable-service", () => ({
  generateDraftSessionsForActiveClassTimetables: generateDraftSessionsForActiveClassTimetablesMock,
}));

const route = await import("@/app/api/admin/classes/timetables/generate/route");

describe("POST /api/admin/classes/timetables/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123", role: "admin" });
    generateDraftSessionsForActiveClassTimetablesMock.mockResolvedValue({
      generateUntil: "2026-05-23",
      timetableCount: 2,
      createdCount: 5,
      skippedExistingCount: 3,
      results: [],
    });
  });

  it("generates drafts until the requested date", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/admin/classes/timetables/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateUntil: "2026-05-23" }),
      })
    );

    expect(response.status).toBe(200);
    expect(generateDraftSessionsForActiveClassTimetablesMock).toHaveBeenCalledWith({
      generateUntil: "2026-05-23",
      actorUserId: "admin_123",
    });
  });

  it("rejects requests without a generate-until date", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/admin/classes/timetables/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Generate-until date is required",
    });
  });
});
