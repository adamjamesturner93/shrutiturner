import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminUserMock = vi.fn();
const rescheduleClassSessionsForWeekMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/classes/session-service", () => ({
  rescheduleClassSessionsForWeek: rescheduleClassSessionsForWeekMock,
}));

const route = await import("@/app/api/admin/classes/sessions/reschedule-week/route");

describe("POST /api/admin/classes/sessions/reschedule-week", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123", role: "admin" });
    rescheduleClassSessionsForWeekMock.mockResolvedValue({
      weekStart: "2026-03-23",
      weekEndExclusive: "2026-03-30",
      dayDelta: 7,
      updatedCount: 4,
      skippedCount: 2,
    });
  });

  it("validates the week-start date", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/admin/classes/sessions/reschedule-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayDelta: 7 }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "A valid week start date is required.",
    });
  });

  it("validates the day shift", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/admin/classes/sessions/reschedule-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: "2026-03-23", dayDelta: 0 }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Choose a whole-day shift between -14 and 14, excluding 0.",
    });
  });

  it("reschedules a week using the signed-in admin id", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/admin/classes/sessions/reschedule-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: "2026-03-23",
          dayDelta: 7,
        }),
      })
    );

    expect(rescheduleClassSessionsForWeekMock).toHaveBeenCalledWith({
      weekStart: "2026-03-23",
      dayDelta: 7,
      adminUserId: "admin_123",
    });
    expect(response.status).toBe(200);
  });
});
