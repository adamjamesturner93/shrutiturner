import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminUserMock = vi.fn();
const publishActiveClassTimetablesForWeekMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/classes/timetable-service", () => ({
  publishActiveClassTimetablesForWeek: publishActiveClassTimetablesForWeekMock,
}));

const route = await import("@/app/api/admin/classes/timetables/publish-week/route");

describe("POST /api/admin/classes/timetables/publish-week", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123", role: "admin" });
    publishActiveClassTimetablesForWeekMock.mockResolvedValue({
      weekStart: "2026-04-06",
      publishUntil: "2026-04-12",
      timetableCount: 2,
      publishedCount: 3,
      createdDraftCount: 1,
      results: [],
    });
  });

  it("publishes a single grouped week", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/admin/classes/timetables/publish-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: "2026-04-06" }),
      })
    );

    expect(response.status).toBe(200);
    expect(publishActiveClassTimetablesForWeekMock).toHaveBeenCalledWith({
      weekStart: "2026-04-06",
    });
  });

  it("rejects requests without a week start", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/admin/classes/timetables/publish-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Week start is required",
    });
  });
});
