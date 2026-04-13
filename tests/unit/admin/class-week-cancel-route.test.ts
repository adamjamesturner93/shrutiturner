import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminUserMock = vi.fn();
const cancelClassSessionsForWeekMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/classes/booking-service", () => ({
  cancelClassSessionsForWeek: cancelClassSessionsForWeekMock,
}));

const route = await import("@/app/api/admin/classes/sessions/cancel-week/route");

describe("POST /api/admin/classes/sessions/cancel-week", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123", role: "admin" });
    cancelClassSessionsForWeekMock.mockResolvedValue({
      weekStart: "2026-03-23",
      weekEndExclusive: "2026-03-30",
      cancelledCount: 4,
      skippedCount: 2,
    });
  });

  it("validates the week-start date", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/admin/classes/sessions/cancel-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "A valid week start date is required.",
    });
  });

  it("cancels a week using the signed-in admin id", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/admin/classes/sessions/cancel-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: "2026-03-23",
          reason: "Cover week",
        }),
      })
    );

    expect(cancelClassSessionsForWeekMock).toHaveBeenCalledWith({
      weekStart: "2026-03-23",
      cancelledByUserId: "admin_123",
      reason: "Cover week",
    });
    expect(response.status).toBe(200);
  });
});
