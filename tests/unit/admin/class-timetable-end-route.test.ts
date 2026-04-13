import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminUserMock = vi.fn();
const endClassTimetableRuleMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/classes/timetable-service", () => ({
  endClassTimetableRule: endClassTimetableRuleMock,
}));

const route = await import("@/app/api/admin/classes/timetables/[id]/end/route");

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/classes/timetables/rule_123/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/classes/timetables/[id]/end", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123", role: "admin" });
    endClassTimetableRuleMock.mockResolvedValue({
      mode: "immediate",
      lastClassDate: "2026-03-22",
      cancelledCount: 3,
      skippedCount: 0,
      active: false,
    });
  });

  it("ends a timetable immediately", async () => {
    const response = await route.POST(createRequest({ mode: "immediate" }), {
      params: Promise.resolve({ id: "rule_123" }),
    });

    expect(response.status).toBe(200);
    expect(endClassTimetableRuleMock).toHaveBeenCalledWith({
      timetableRuleId: "rule_123",
      endedByUserId: "admin_123",
      mode: "immediate",
      lastClassDate: undefined,
      reason: undefined,
    });
  });

  it("rejects a last-class-date request without a date", async () => {
    const response = await route.POST(createRequest({ mode: "last-class-date" }), {
      params: Promise.resolve({ id: "rule_123" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Last class date is required",
    });
    expect(endClassTimetableRuleMock).not.toHaveBeenCalled();
  });
});
