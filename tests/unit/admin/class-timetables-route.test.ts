import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminUserMock = vi.fn();
const createClassTimetableRuleMock = vi.fn();
const generateDraftSessionsForTimetableRuleMock = vi.fn();
const listClassTimetableRulesMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/classes/timetable-service", () => ({
  createClassTimetableRule: createClassTimetableRuleMock,
  generateDraftSessionsForTimetableRule: generateDraftSessionsForTimetableRuleMock,
  listClassTimetableRules: listClassTimetableRulesMock,
}));

const route = await import("@/app/api/admin/classes/timetables/route");

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/classes/timetables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/classes/timetables", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123", role: "admin" });
    createClassTimetableRuleMock.mockResolvedValue({ id: "rule_123" });
    generateDraftSessionsForTimetableRuleMock.mockResolvedValue({
      createdCount: 8,
      skippedExistingCount: 0,
      createdSessionIds: ["session_1"],
    });
  });

  it("uses the signed-in admin as the default instructor when none is provided", async () => {
    const response = await route.POST(
      createRequest({
        classDefinitionSlug: "strength-foundations",
        weekday: 2,
        startsAtLocal: "09:00",
        durationMinutes: 45,
        defaultCapacity: 10,
        startsOn: "2026-03-24",
      })
    );

    expect(response.status).toBe(201);
    expect(createClassTimetableRuleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        classDefinitionSlug: "strength-foundations",
        instructorUserId: "admin_123",
      }),
      "admin_123"
    );
    expect(generateDraftSessionsForTimetableRuleMock).toHaveBeenCalledWith("rule_123", {
      fromDate: new Date("2026-03-24T00:00:00.000Z"),
      actorUserId: "admin_123",
    });
    await expect(response.json()).resolves.toEqual({
      id: "rule_123",
      draftCreatedCount: 8,
      draftSkippedExistingCount: 0,
    });
  });

  it("still rejects requests that are missing other required timetable fields", async () => {
    const response = await route.POST(
      createRequest({
        classDefinitionSlug: "strength-foundations",
        startsAtLocal: "09:00",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "Missing required fields" });
    expect(createClassTimetableRuleMock).not.toHaveBeenCalled();
  });
});
