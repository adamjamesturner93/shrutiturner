import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ClassSessionStatus } from "@prisma/client";
import { db } from "@/lib/db";

const {
  getClassDefinitionBySlugMock,
  getClassDefinitionsMock,
  getInstructorProfilesByIdsMock,
  sendClassCancellationMock,
  sendClassUnbookingMock,
  isDailyConfiguredMock,
  createSessionRoomMock,
} = vi.hoisted(() => ({
  getClassDefinitionBySlugMock: vi.fn(),
  getClassDefinitionsMock: vi.fn(),
  getInstructorProfilesByIdsMock: vi.fn(),
  sendClassCancellationMock: vi.fn(),
  sendClassUnbookingMock: vi.fn(),
  isDailyConfiguredMock: vi.fn(),
  createSessionRoomMock: vi.fn(),
}));

vi.mock("@/lib/content", () => ({
  getClassDefinitionBySlug: getClassDefinitionBySlugMock,
  getClassDefinitions: getClassDefinitionsMock,
  getInstructorProfilesByIds: getInstructorProfilesByIdsMock,
}));

vi.mock("@/lib/email", () => ({
  sendClassCancellation: sendClassCancellationMock,
  sendClassUnbooking: sendClassUnbookingMock,
  sendBookingConfirmation: vi.fn(),
  sendClassReminder: vi.fn(),
  sendInstructorNotification: vi.fn(),
  sendWaitlistJoinedEmail: vi.fn(),
  sendWaitlistPromotedEmail: vi.fn(),
}));

vi.mock("@/lib/daily/service", () => ({
  isDailyConfigured: isDailyConfiguredMock,
  createSessionRoom: createSessionRoomMock,
}));

import {
  createClassTimetableRule,
  endClassTimetableRule,
  generateDraftSessionsForTimetableRule,
  publishClassTimetableRule,
} from "@/lib/classes/timetable-service";

const USER_PREFIX = "integration-recurring-end-";
const CLASS_SLUG = "integration-recurring-end-strength";

async function cleanupRows() {
  await db.classSession.deleteMany({
    where: {
      classDefinitionSlug: {
        startsWith: "integration-recurring-end-",
      },
    },
  });
  await db.classTimetableExclusion.deleteMany({
    where: {
      timetableRule: {
        classDefinitionSlug: {
          startsWith: "integration-recurring-end-",
        },
      },
    },
  });
  await db.classTimetableRule.deleteMany({
    where: {
      classDefinitionSlug: {
        startsWith: "integration-recurring-end-",
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

describe("end class timetable rule", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupRows();

    getClassDefinitionBySlugMock.mockResolvedValue({
      slug: CLASS_SLUG,
      name: "Integration Timetable End Strength",
      type: "Strength",
      level: "Adaptive",
      defaultInstructorProfileEntryId: "cf-instructor-1",
    });
    getClassDefinitionsMock.mockResolvedValue([
      {
        slug: CLASS_SLUG,
        name: "Integration Timetable End Strength",
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
    isDailyConfiguredMock.mockReturnValue(false);
    createSessionRoomMock.mockResolvedValue({
      roomName: "unused",
      roomUrl: "https://daily.example/unused",
    });
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("can stop a recurring class immediately and cancel future draft and scheduled sessions", async () => {
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
        classDefinitionSlug: CLASS_SLUG,
        weekday: 1,
        startsAtLocal: "18:30",
        durationMinutes: 45,
        defaultCapacity: 12,
        instructorUserId: instructor.id,
        startsOn: "2026-04-06",
      },
      admin.id
    );

    await generateDraftSessionsForTimetableRule(rule.id, {
      fromDate: new Date("2026-04-01T00:00:00.000Z"),
      horizonWeeks: 4,
    });
    await publishClassTimetableRule(rule.id, {
      fromDate: new Date("2026-04-01T00:00:00.000Z"),
      horizonWeeks: 2,
    });

    const result = await endClassTimetableRule({
      timetableRuleId: rule.id,
      endedByUserId: admin.id,
      mode: "immediate",
      now: new Date("2026-04-10T09:00:00.000Z"),
    });

    expect(result.cancelledCount).toBe(3);
    expect(result.lastClassDate).toBe("2026-04-09");
    expect(result.active).toBe(false);

    const refreshedRule = await db.classTimetableRule.findUnique({
      where: { id: rule.id },
      select: { active: true, endsOn: true },
    });
    expect(refreshedRule?.active).toBe(false);
    expect(refreshedRule?.endsOn?.toISOString().slice(0, 10)).toBe("2026-04-09");

    const statuses = await db.classSession.findMany({
      where: { timetableRuleId: rule.id },
      orderBy: { startsAtUtc: "asc" },
      select: {
        localDate: true,
        status: true,
      },
    });
    expect(
      statuses.map((session) => ({
        localDate: session.localDate?.toISOString().slice(0, 10),
        status: session.status,
      }))
    ).toEqual([
      { localDate: "2026-04-06", status: ClassSessionStatus.scheduled },
      { localDate: "2026-04-13", status: ClassSessionStatus.cancelled },
      { localDate: "2026-04-20", status: ClassSessionStatus.cancelled },
      { localDate: "2026-04-27", status: ClassSessionStatus.cancelled },
    ]);
  });

  it("can keep sessions up to a selected last class date and cancel later ones", async () => {
    const admin = await db.user.create({
      data: {
        email: createUserEmail("admin-2"),
        firstName: "Admin",
        lastName: "User",
      },
    });
    const instructor = await db.user.create({
      data: {
        email: createUserEmail("instructor-2"),
        firstName: "Shruti",
        lastName: "Turner",
        instructorProfileEntryId: "cf-instructor-1",
      },
    });

    const rule = await createClassTimetableRule(
      {
        classDefinitionSlug: CLASS_SLUG,
        weekday: 1,
        startsAtLocal: "18:30",
        durationMinutes: 45,
        defaultCapacity: 12,
        instructorUserId: instructor.id,
        startsOn: "2026-04-06",
      },
      admin.id
    );

    await generateDraftSessionsForTimetableRule(rule.id, {
      fromDate: new Date("2026-04-01T00:00:00.000Z"),
      horizonWeeks: 4,
    });
    await publishClassTimetableRule(rule.id, {
      fromDate: new Date("2026-04-01T00:00:00.000Z"),
      horizonWeeks: 1,
    });

    const result = await endClassTimetableRule({
      timetableRuleId: rule.id,
      endedByUserId: admin.id,
      mode: "last-class-date",
      lastClassDate: "2026-04-20",
      now: new Date("2026-04-10T09:00:00.000Z"),
    });

    expect(result.cancelledCount).toBe(1);
    expect(result.lastClassDate).toBe("2026-04-20");
    expect(result.active).toBe(true);

    const refreshedRule = await db.classTimetableRule.findUnique({
      where: { id: rule.id },
      select: { active: true, endsOn: true },
    });
    expect(refreshedRule?.active).toBe(true);
    expect(refreshedRule?.endsOn?.toISOString().slice(0, 10)).toBe("2026-04-20");

    const statuses = await db.classSession.findMany({
      where: { timetableRuleId: rule.id },
      orderBy: { startsAtUtc: "asc" },
      select: {
        localDate: true,
        status: true,
      },
    });
    expect(
      statuses.map((session) => ({
        localDate: session.localDate?.toISOString().slice(0, 10),
        status: session.status,
      }))
    ).toEqual([
      { localDate: "2026-04-06", status: ClassSessionStatus.scheduled },
      { localDate: "2026-04-13", status: ClassSessionStatus.draft },
      { localDate: "2026-04-20", status: ClassSessionStatus.draft },
      { localDate: "2026-04-27", status: ClassSessionStatus.cancelled },
    ]);
  });
});
