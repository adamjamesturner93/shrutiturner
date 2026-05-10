import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ClassRoomSetupStatus, ClassSessionStatus } from "@prisma/client";
import { db } from "@/lib/db";

const {
  getClassDefinitionBySlugMock,
  getClassDefinitionsMock,
  getInstructorProfilesByIdsMock,
  isDailyConfiguredMock,
  createSessionRoomMock,
} = vi.hoisted(() => ({
  getClassDefinitionBySlugMock: vi.fn(),
  getClassDefinitionsMock: vi.fn(),
  getInstructorProfilesByIdsMock: vi.fn(),
  isDailyConfiguredMock: vi.fn(),
  createSessionRoomMock: vi.fn(),
}));

vi.mock("@/lib/content", () => ({
  getClassDefinitionBySlug: getClassDefinitionBySlugMock,
  getClassDefinitions: getClassDefinitionsMock,
  getInstructorProfilesByIds: getInstructorProfilesByIdsMock,
}));

vi.mock("@/lib/daily/service", () => ({
  isDailyConfigured: isDailyConfiguredMock,
  createSessionRoom: createSessionRoomMock,
}));

import {
  createClassTimetableRule,
  generateDraftSessionsForActiveClassTimetables,
  generateDraftSessionsForTimetableRule,
  publishActiveClassTimetablesForWeek,
  publishClassTimetableRule,
} from "@/lib/classes/timetable-service";

const USER_PREFIX = "integration-timetable-";

async function cleanupRows() {
  await db.classSession.deleteMany({
    where: {
      classDefinitionSlug: {
        startsWith: "integration-timetable-",
      },
    },
  });
  await db.classTimetableExclusion.deleteMany({
    where: {
      timetableRule: {
        classDefinitionSlug: {
          startsWith: "integration-timetable-",
        },
      },
    },
  });
  await db.classTimetableRule.deleteMany({
    where: {
      classDefinitionSlug: {
        startsWith: "integration-timetable-",
      },
    },
  });
  await db.adminActionLog.deleteMany({
    where: {
      actor: {
        email: {
          startsWith: USER_PREFIX,
        },
      },
    },
  });
  await db.user.deleteMany({
    where: {
      email: {
        startsWith: USER_PREFIX,
      },
    },
  });
}

function createUserEmail(label: string) {
  return `${USER_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe("draft and publish timetable sessions", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupRows();

    getClassDefinitionBySlugMock.mockResolvedValue({
      slug: "integration-timetable-strength",
      name: "Integration Timetable Strength",
      type: "Strength",
      level: "Adaptive",
      defaultInstructorProfileEntryId: "cf-instructor-1",
    });
    getClassDefinitionsMock.mockResolvedValue([
      {
        slug: "integration-timetable-strength",
        name: "Integration Timetable Strength",
        type: "Strength",
      },
    ]);
    getInstructorProfilesByIdsMock.mockResolvedValue([
      {
        id: "cf-instructor-1",
        name: "Shruti Turner",
        bio: "Adaptive strength coach",
        avatarImageUrl: null,
      },
    ]);
    isDailyConfiguredMock.mockReturnValue(true);
    createSessionRoomMock.mockImplementation(async (sessionId: string) => ({
      roomName: `room-${sessionId}`,
      roomUrl: `https://daily.example/${sessionId}`,
    }));
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("creates draft sessions first, then publishes them without creating Daily rooms", async () => {
    const admin = await db.user.create({
      data: {
        email: createUserEmail("admin"),
        firstName: "Admin",
        lastName: "User",
      },
    });
    const instructor = await db.user.create({
      data: {
        email: createUserEmail("instructor"),
        firstName: "Shruti",
        lastName: "Turner",
        instructorProfileEntryId: "cf-instructor-1",
      },
    });

    const rule = await createClassTimetableRule(
      {
        classDefinitionSlug: "integration-timetable-strength",
        weekday: 1,
        startsAtLocal: "18:30",
        durationMinutes: 45,
        defaultCapacity: 12,
        instructorUserId: instructor.id,
        startsOn: "2026-03-02",
        exclusionDates: ["2026-03-09"],
      },
      admin.id
    );

    const draftGeneration = await generateDraftSessionsForTimetableRule(rule.id, {
      fromDate: new Date("2026-03-01T00:00:00.000Z"),
      horizonWeeks: 4,
    });

    expect(draftGeneration.createdCount).toBe(3);
    expect(draftGeneration.skippedExistingCount).toBe(0);
    expect(createSessionRoomMock).not.toHaveBeenCalled();

    const draftSessions = await db.classSession.findMany({
      where: {
        timetableRuleId: rule.id,
      },
      orderBy: {
        startsAtUtc: "asc",
      },
      select: {
        localDate: true,
        generationKey: true,
        roomSetupStatus: true,
        dailyRoomUrl: true,
        instructorNameSnapshot: true,
        status: true,
      },
    });

    expect(draftSessions).toHaveLength(3);
    expect(draftSessions.map((session) => session.localDate?.toISOString().slice(0, 10))).toEqual([
      "2026-03-02",
      "2026-03-16",
      "2026-03-23",
    ]);
    expect(
      draftSessions.every((session) => session.roomSetupStatus === ClassRoomSetupStatus.pending)
    ).toBe(true);
    expect(draftSessions.every((session) => session.dailyRoomUrl === null)).toBe(true);
    expect(
      draftSessions.every((session) => session.instructorNameSnapshot === "Shruti Turner")
    ).toBe(true);
    expect(draftSessions.every((session) => session.status === ClassSessionStatus.draft)).toBe(
      true
    );
    expect(draftSessions[0]?.generationKey).toBe(`${rule.id}:2026-03-02`);

    const firstPublish = await publishClassTimetableRule(rule.id, {
      fromDate: new Date("2026-03-01T00:00:00.000Z"),
      horizonWeeks: 4,
    });

    expect(firstPublish.draftCreatedCount).toBe(0);
    expect(firstPublish.publishedCount).toBe(3);
    expect(firstPublish.skippedExistingCount).toBe(3);
    expect(firstPublish.failedRoomSetupCount).toBe(0);
    expect(createSessionRoomMock).not.toHaveBeenCalled();

    const publishedSessions = await db.classSession.findMany({
      where: {
        timetableRuleId: rule.id,
      },
      orderBy: {
        startsAtUtc: "asc",
      },
      select: {
        roomSetupStatus: true,
        dailyRoomUrl: true,
        status: true,
      },
    });

    expect(
      publishedSessions.every((session) => session.roomSetupStatus === ClassRoomSetupStatus.pending)
    ).toBe(true);
    expect(publishedSessions.every((session) => session.dailyRoomUrl === null)).toBe(true);
    expect(
      publishedSessions.every((session) => session.status === ClassSessionStatus.scheduled)
    ).toBe(true);

    const secondPublish = await publishClassTimetableRule(rule.id, {
      fromDate: new Date("2026-03-01T00:00:00.000Z"),
      horizonWeeks: 4,
    });

    expect(secondPublish.draftCreatedCount).toBe(0);
    expect(secondPublish.publishedCount).toBe(0);
    expect(secondPublish.skippedExistingCount).toBe(3);
  });

  it("can generate drafts to a chosen date across active rules and publish one week at a time", async () => {
    const admin = await db.user.create({
      data: {
        email: createUserEmail("admin-week"),
        firstName: "Admin",
        lastName: "User",
      },
    });
    const instructor = await db.user.create({
      data: {
        email: createUserEmail("instructor-week"),
        firstName: "Shruti",
        lastName: "Turner",
        instructorProfileEntryId: "cf-instructor-1",
      },
    });

    await createClassTimetableRule(
      {
        classDefinitionSlug: "integration-timetable-strength",
        weekday: 1,
        startsAtLocal: "18:30",
        durationMinutes: 45,
        defaultCapacity: 12,
        instructorUserId: instructor.id,
        startsOn: "2026-03-02",
      },
      admin.id
    );

    const draftResult = await generateDraftSessionsForActiveClassTimetables({
      generateUntil: "2026-03-23",
      fromDate: new Date("2026-03-01T00:00:00.000Z"),
    });

    expect(draftResult.createdCount).toBe(4);

    const publishWeekResult = await publishActiveClassTimetablesForWeek({
      weekStart: "2026-03-16",
      fromDate: new Date("2026-03-01T00:00:00.000Z"),
    });

    expect(publishWeekResult.publishedCount).toBe(1);
    expect(publishWeekResult.createdDraftCount).toBe(0);

    const sessions = await db.classSession.findMany({
      where: {
        classDefinitionSlug: "integration-timetable-strength",
      },
      orderBy: {
        startsAtUtc: "asc",
      },
      select: {
        localDate: true,
        status: true,
      },
    });

    expect(
      sessions.map((session) => ({
        localDate: session.localDate?.toISOString().slice(0, 10),
        status: session.status,
      }))
    ).toEqual([
      { localDate: "2026-03-02", status: ClassSessionStatus.draft },
      { localDate: "2026-03-09", status: ClassSessionStatus.draft },
      { localDate: "2026-03-16", status: ClassSessionStatus.scheduled },
      { localDate: "2026-03-23", status: ClassSessionStatus.draft },
    ]);
  });
});
