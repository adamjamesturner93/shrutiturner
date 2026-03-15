import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

const {
  getClassDefinitionBySlugMock,
  getInstructorProfilesByIdsMock,
  isDailyConfiguredMock,
} = vi.hoisted(() => ({
  getClassDefinitionBySlugMock: vi.fn(),
  getInstructorProfilesByIdsMock: vi.fn().mockResolvedValue([]),
  isDailyConfiguredMock: vi.fn().mockReturnValue(false),
}));

vi.mock("@/lib/content", () => ({
  getClassDefinitionBySlug: getClassDefinitionBySlugMock,
  getClassDefinitions: vi.fn().mockResolvedValue([]),
  getInstructorProfilesByIds: getInstructorProfilesByIdsMock,
}));

vi.mock("@/lib/daily/service", () => ({
  isDailyConfigured: isDailyConfiguredMock,
  createSessionRoom: vi.fn(),
}));

import { bulkCreateClassSessions } from "@/lib/classes/session-service";

const USER_PREFIX = "integration-session-timezone-";

async function cleanupSessionRows() {
  await db.classSession.deleteMany({
    where: {
      classDefinitionSlug: {
        startsWith: "integration-",
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

function createInstructorEmail(label: string) {
  return `${USER_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe("class session timezone integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupSessionRows();

    getClassDefinitionBySlugMock.mockResolvedValue({
      slug: "integration-weekend-yoga-flow",
      name: "Weekend Yoga Flow",
      type: "Yoga",
      level: "All levels",
      defaultInstructorProfileEntryId: null,
    });
  });

  afterAll(async () => {
    await cleanupSessionRows();
  });

  it("stores London winter and summer session runs at the correct UTC times", async () => {
    const instructor = await db.user.create({
      data: {
        email: createInstructorEmail("coach"),
        firstName: "Shruti",
        lastName: "Turner",
      },
    });

    const winter = await bulkCreateClassSessions(
      {
        classDefinitionSlug: "integration-weekend-yoga-flow",
        startDate: "2026-01-15",
        timeLocal: "18:30",
        durationMinutes: 60,
        capacity: 12,
        repeatWeeks: 1,
        weekdays: [4],
      },
      instructor.id
    );

    const summer = await bulkCreateClassSessions(
      {
        classDefinitionSlug: "integration-weekend-yoga-flow",
        startDate: "2026-07-15",
        timeLocal: "18:30",
        durationMinutes: 60,
        capacity: 12,
        repeatWeeks: 1,
        weekdays: [3],
      },
      instructor.id
    );

    const rows = await db.classSession.findMany({
      where: {
        id: {
          in: [...winter.createdSessionIds, ...summer.createdSessionIds],
        },
      },
      orderBy: {
        startsAtUtc: "asc",
      },
      select: {
        startsAtUtc: true,
        timezone: true,
      },
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.startsAtUtc.toISOString()).toBe("2026-01-15T18:30:00.000Z");
    expect(rows[1]?.startsAtUtc.toISOString()).toBe("2026-07-15T17:30:00.000Z");
    expect(rows.map((row) => row.timezone)).toEqual(["Europe/London", "Europe/London"]);
  });
});
