import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { MembershipPlan, MembershipStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminMemberDetail, listAdminMembers } from "@/lib/admin/members-service";

const USER_PREFIX = "integration-admin-members-";
const CLASS_PREFIX = "integration-admin-member-class-";

async function cleanupRows() {
  await db.classAttendanceEvent.deleteMany({
    where: {
      session: {
        classDefinitionSlug: { startsWith: CLASS_PREFIX },
      },
    },
  });
  await db.classBooking.deleteMany({
    where: {
      session: {
        classDefinitionSlug: { startsWith: CLASS_PREFIX },
      },
    },
  });
  await db.classSession.deleteMany({
    where: {
      classDefinitionSlug: { startsWith: CLASS_PREFIX },
    },
  });
  await db.membershipSubscription.deleteMany({
    where: {
      user: {
        email: { startsWith: USER_PREFIX },
      },
    },
  });
  await db.newsletterSubscriber.deleteMany({
    where: {
      email: { startsWith: USER_PREFIX },
    },
  });
  await db.userNotificationPreference.deleteMany({
    where: {
      user: {
        email: { startsWith: USER_PREFIX },
      },
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

describe("admin member service", () => {
  beforeEach(async () => {
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it(
    "returns real booking and notification data for admin member views",
    async () => {
    const instructor = await db.user.create({
      data: {
        email: createEmail("instructor"),
        firstName: "Shruti",
        lastName: "Turner",
        role: "admin",
      },
    });
    const member = await db.user.create({
      data: {
        email: createEmail("member"),
        firstName: "Nina",
        lastName: "Member",
        adminNotes: "Needs chair-based options.",
      },
    });

    await db.userNotificationPreference.create({
      data: {
        userId: member.id,
        classReminders: false,
        scheduleUpdates: true,
        programAnnouncements: false,
        marketingEmails: false,
      },
    });

    await db.newsletterSubscriber.create({
      data: {
        email: member.email,
        userId: member.id,
        token: `token-${member.id}`,
        status: "unsubscribed",
      },
    });

    await db.membershipSubscription.create({
      data: {
        id: `membership-${member.id}`,
        userId: member.id,
        plan: MembershipPlan.movewell,
        status: MembershipStatus.active,
        pricePence: 2900,
        currency: "GBP",
        classesPerWeek: 3,
        classesUsedThisWeek: 1,
        startsAt: new Date("2026-03-01T00:00:00.000Z"),
        renewsAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    });

    const pastSession = await db.classSession.create({
      data: {
        classDefinitionSlug: `${CLASS_PREFIX}past`,
        titleSnapshot: "Past Session",
        typeSnapshot: "Strength",
        levelSnapshot: "Adaptive",
        durationMinutes: 45,
        startsAtUtc: new Date("2026-03-10T18:00:00.000Z"),
        endsAtUtc: new Date("2026-03-10T18:45:00.000Z"),
        timezone: "Europe/London",
        capacity: 10,
        instructorUserId: instructor.id,
      },
    });
    const futureSession = await db.classSession.create({
      data: {
        classDefinitionSlug: `${CLASS_PREFIX}future`,
        titleSnapshot: "Future Session",
        typeSnapshot: "Yoga",
        levelSnapshot: "All levels",
        durationMinutes: 60,
        startsAtUtc: new Date("2099-03-20T09:00:00.000Z"),
        endsAtUtc: new Date("2099-03-20T10:00:00.000Z"),
        timezone: "Europe/London",
        capacity: 8,
        instructorUserId: instructor.id,
      },
    });

    await db.classBooking.createMany({
      data: [
        {
          sessionId: pastSession.id,
          userId: member.id,
          status: "attended",
          attendanceSource: "manual",
        },
        {
          sessionId: futureSession.id,
          userId: member.id,
          status: "booked",
        },
      ],
    });

    const [list, detail] = await Promise.all([
      listAdminMembers({}),
      getAdminMemberDetail(member.id),
    ]);

    const listRow = list.find((row) => row.id === member.id);
    expect(listRow).toMatchObject({
      totalBookings: 2,
      lastClassDate: "2026-03-10",
      newsletterSubscribed: false,
      marketingEmails: false,
      classReminders: false,
      scheduleUpdates: true,
      programAnnouncements: false,
      notes: "Needs chair-based options.",
    });

    expect(detail).toMatchObject({
      id: member.id,
      totalBookings: 2,
      lastClassDate: "2026-03-10",
      newsletterSubscribed: false,
      marketingEmails: false,
      classReminders: false,
      scheduleUpdates: true,
      programAnnouncements: false,
      notes: "Needs chair-based options.",
    });
    },
    15_000
  );
});
