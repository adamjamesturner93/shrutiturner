import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getScheduleGroupedByDay } from "@/lib/classes/session-service";

const USER_PREFIX = "integration-schedule-grouping-";
const CLASS_SLUG = "strength-foundations";

async function cleanupRows() {
  await db.classAttendanceEvent.deleteMany({
    where: {
      session: {
        classDefinitionSlug: CLASS_SLUG,
        titleSnapshot: "Grouped Schedule Session",
      },
    },
  });
  await db.classBooking.deleteMany({
    where: {
      session: {
        classDefinitionSlug: CLASS_SLUG,
        titleSnapshot: "Grouped Schedule Session",
      },
    },
  });
  await db.classSession.deleteMany({
    where: {
      classDefinitionSlug: CLASS_SLUG,
      titleSnapshot: "Grouped Schedule Session",
    },
  });
  await db.user.deleteMany({
    where: {
      email: { startsWith: USER_PREFIX },
    },
  });
}

function createEmail(label: string) {
  return `${USER_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe("getScheduleGroupedByDay", () => {
  beforeEach(async () => {
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("preserves booked counts for grouped schedule cards", async () => {
    const instructor = await db.user.create({
      data: {
        email: createEmail("instructor"),
        firstName: "Shruti",
        lastName: "Turner",
        role: "admin",
      },
    });
    const attendee = await db.user.create({
      data: {
        email: createEmail("attendee"),
        firstName: "Ava",
        lastName: "Student",
      },
    });

    const startsAt = new Date("2099-03-20T09:00:00.000Z");
    const session = await db.classSession.create({
      data: {
        classDefinitionSlug: CLASS_SLUG,
        titleSnapshot: "Grouped Schedule Session",
        typeSnapshot: "Strength",
        levelSnapshot: "Adaptive",
        durationMinutes: 45,
        startsAtUtc: startsAt,
        endsAtUtc: new Date(startsAt.getTime() + 45 * 60_000),
        timezone: "Europe/London",
        capacity: 12,
        instructorUserId: instructor.id,
      },
    });

    await db.classBooking.create({
      data: {
        sessionId: session.id,
        userId: attendee.id,
        status: "booked",
      },
    });

    const grouped = await getScheduleGroupedByDay({
      from: new Date("2099-03-19T00:00:00.000Z"),
      to: new Date("2099-03-21T00:00:00.000Z"),
    });

    expect(grouped).toHaveLength(1);
    const groupedSession = grouped[0]?.classes.find((item) => item.sessionId === session.id);
    expect(groupedSession).toMatchObject({
      sessionId: session.id,
      bookedCount: 1,
      spotsRemaining: 11,
    });
  });
});
