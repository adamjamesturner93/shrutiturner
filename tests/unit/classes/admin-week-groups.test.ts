import { describe, expect, it } from "vitest";
import { groupAdminSessionsByWeek } from "@/lib/classes/admin-week-groups";
import type { AdminClassSessionDto } from "@/lib/classes/types";

function buildSession(overrides: Partial<AdminClassSessionDto>): AdminClassSessionDto {
  return {
    id: overrides.id || "session_1",
    classDefinitionSlug: "strength-foundations",
    title: "Strength Foundations",
    type: "Strength",
    level: "Adaptive",
    localDate: overrides.localDate || "2026-03-24",
    startsAtUtc: overrides.startsAtUtc || "2026-03-24T18:00:00.000Z",
    endsAtUtc: overrides.endsAtUtc || "2026-03-24T18:45:00.000Z",
    timezone: "Europe/London",
    durationMinutes: 45,
    capacity: 10,
    status: overrides.status || "scheduled",
    instructorProfileEntryId: null,
    instructorName: "Shruti Turner",
    instructorBio: null,
    instructorAvatarUrl: null,
    spotsRemaining: 9,
    bookedCount: 1,
    waitlistCount: 0,
    dailyRoomUrl: null,
    roomSetupStatus: "pending",
    roomSetupError: null,
    communityModeEnabled: false,
    threeHourOutcome: "pending",
    joinWindowOpensAt: "2026-03-24T17:50:00.000Z",
    preJoinWindowMinutes: 10,
    lateJoinCutoffMinutes: 5,
    lateJoinCutoffAt: "2026-03-24T18:05:00.000Z",
    isBookedByCurrentUser: false,
    myBookingStatus: null,
    hasPreviouslyJoinedCurrentUser: false,
    waitlistPosition: null,
    notes: "",
    cancelReason: null,
    attendedCount: 0,
    noShowCount: 0,
    ...overrides,
  };
}

describe("groupAdminSessionsByWeek", () => {
  it("groups sessions by Monday week start and counts only future draft/scheduled rows as cancellable", () => {
    const groups = groupAdminSessionsByWeek(
      [
        buildSession({
          id: "session_a",
          localDate: "2026-03-23",
          startsAtUtc: "2026-03-23T09:00:00.000Z",
          status: "draft",
        }),
        buildSession({
          id: "session_b",
          localDate: "2026-03-27",
          startsAtUtc: "2026-03-27T09:00:00.000Z",
          status: "scheduled",
        }),
        buildSession({
          id: "session_c",
          localDate: "2026-03-28",
          startsAtUtc: "2026-03-28T09:00:00.000Z",
          status: "completed",
        }),
      ],
      new Date("2026-03-22T12:00:00.000Z")
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      weekStart: "2026-03-23",
      weekEndExclusive: "2026-03-30",
      cancelEligibleCount: 2,
    });
    expect(groups[0].sessions.map((session) => session.id)).toEqual([
      "session_a",
      "session_b",
      "session_c",
    ]);
  });
});
