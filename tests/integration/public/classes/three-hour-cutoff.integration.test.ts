import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AcceptanceType,
  BookingEntitlementType,
  ClassBookingStatus,
  ClassSessionStatus,
  ClassWaitlistStatus,
  MembershipPlan,
  MembershipStatus,
} from "@prisma/client";
import { CURRENT_HEALTH_DATA_CONSENT_VERSION } from "@/data/legal-documents";
import { db } from "@/lib/db";
import { recordAcceptanceEvent } from "@/lib/legal/acceptance-service";

const {
  sendBookingConfirmationMock,
  sendClassCancellationMock,
  sendClassUnbookingMock,
  sendClassReminderMock,
  sendInstructorNotificationMock,
  sendWaitlistJoinedEmailMock,
  sendWaitlistPromotedEmailMock,
} = vi.hoisted(() => ({
  sendBookingConfirmationMock: vi.fn().mockResolvedValue({ success: true }),
  sendClassCancellationMock: vi.fn().mockResolvedValue({ success: true }),
  sendClassUnbookingMock: vi.fn().mockResolvedValue({ success: true }),
  sendClassReminderMock: vi.fn().mockResolvedValue({ success: true }),
  sendInstructorNotificationMock: vi.fn().mockResolvedValue({ success: true }),
  sendWaitlistJoinedEmailMock: vi.fn().mockResolvedValue({ success: true }),
  sendWaitlistPromotedEmailMock: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/email", () => ({
  sendBookingConfirmation: sendBookingConfirmationMock,
  sendClassCancellation: sendClassCancellationMock,
  sendClassUnbooking: sendClassUnbookingMock,
  sendClassReminder: sendClassReminderMock,
  sendInstructorNotification: sendInstructorNotificationMock,
  sendWaitlistJoinedEmail: sendWaitlistJoinedEmailMock,
  sendWaitlistPromotedEmail: sendWaitlistPromotedEmailMock,
}));

import {
  bookClassSession,
  cancelOwnBooking,
  processThreeHourClassCutoff,
} from "@/lib/classes/booking-service";

const USER_PREFIX = "integration-cutoff-";

async function cleanupRows() {
  await db.classOperationalSettings.deleteMany({
    where: { id: "default" },
  });
  await db.classAttendanceEvent.deleteMany({
    where: {
      session: {
        classDefinitionSlug: {
          startsWith: "integration-cutoff-",
        },
      },
    },
  });
  await db.classBooking.deleteMany({
    where: {
      session: {
        classDefinitionSlug: {
          startsWith: "integration-cutoff-",
        },
      },
    },
  });
  await db.classWaitlistEntry.deleteMany({
    where: {
      session: {
        classDefinitionSlug: {
          startsWith: "integration-cutoff-",
        },
      },
    },
  });
  await db.classSession.deleteMany({
    where: {
      classDefinitionSlug: {
        startsWith: "integration-cutoff-",
      },
    },
  });
  await db.membershipSubscription.deleteMany({
    where: {
      user: {
        email: {
          startsWith: USER_PREFIX,
        },
      },
    },
  });
  await db.userNotificationPreference.deleteMany({
    where: {
      user: {
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

async function createUser(
  label: string,
  firstName: string,
  role: "admin" | "owner_admin" | "student" = "student"
) {
  const user = await db.user.create({
    data: {
      email: createUserEmail(label),
      firstName,
      lastName: "Integration",
      name: `${firstName} Integration`,
      role,
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY",
      isOnboarded: true,
      hasConsentedToHealthData: true,
      acceptedHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
      healthDataConsentedAt: new Date(),
    },
  });

  await db.userNotificationPreference.create({
    data: {
      userId: user.id,
      classReminders: true,
      scheduleUpdates: true,
      programAnnouncements: true,
      marketingEmails: false,
    },
  });

  await db.healthProfile.create({
    data: {
      userId: user.id,
      declarationStatus: "none_declared",
    },
  });

  for (const type of [
    AcceptanceType.terms,
    AcceptanceType.health_waiver,
    AcceptanceType.health_data,
  ]) {
    await recordAcceptanceEvent({
      userId: user.id,
      type,
      surface: "class_booking",
    });
  }

  return user;
}

describe("three-hour cutoff booking flows", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("emails the instructor on first signup for a previously empty class", async () => {
    const instructor = await createUser("instructor", "Shruti", "admin");
    const member = await createUser("member", "Ava");
    const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 45 * 60 * 1000);

    await db.membershipSubscription.create({
      data: {
        id: `membership-${member.id}`,
        userId: member.id,
        plan: MembershipPlan.movewell,
        status: MembershipStatus.active,
        pricePence: 2900,
        currency: "GBP",
        classesPerWeek: 3,
        classesUsedThisWeek: 0,
        startsAt: new Date("2026-03-01T00:00:00.000Z"),
        renewsAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    });

    const session = await db.classSession.create({
      data: {
        classDefinitionSlug: "integration-cutoff-first-signup",
        titleSnapshot: "Integration First Signup",
        typeSnapshot: "Strength",
        levelSnapshot: "Adaptive",
        durationMinutes: 45,
        startsAtUtc: startsAt,
        endsAtUtc: endsAt,
        timezone: "Europe/London",
        capacity: 10,
        status: ClassSessionStatus.scheduled,
        instructorUserId: instructor.id,
        instructorNameSnapshot: "Shruti Turner",
      },
    });

    const result = await bookClassSession(session.id, member.id);

    expect(result.status).toBe("booked");
    expect(sendInstructorNotificationMock).toHaveBeenCalledWith(
      instructor.email,
      "first-signup",
      "Integration First Signup",
      expect.any(String),
      expect.any(String),
      "Ava Integration",
      1,
      expect.any(Date),
      45
    );

    const refreshedSession = await db.classSession.findUniqueOrThrow({
      where: { id: session.id },
      select: { firstSignupInstructorEmailSentAt: true },
    });
    expect(refreshedSession.firstSignupInstructorEmailSentAt).not.toBeNull();
  });

  it("sends dedicated waitlist joined and promoted emails", async () => {
    const instructor = await createUser("waitlist-instructor", "Shruti", "admin");
    const attendee = await createUser("waitlist-attendee", "Ava");
    const waitlisted = await createUser("waitlist-member", "Joel");
    const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 45 * 60 * 1000);

    for (const member of [attendee, waitlisted]) {
      await db.membershipSubscription.create({
        data: {
          id: `membership-${member.id}`,
          userId: member.id,
          plan: MembershipPlan.movewell,
          status: MembershipStatus.active,
          pricePence: 2900,
          currency: "GBP",
          classesPerWeek: 3,
          classesUsedThisWeek: 0,
          startsAt: new Date("2026-03-01T00:00:00.000Z"),
          renewsAt: new Date("2026-04-01T00:00:00.000Z"),
        },
      });
    }

    const session = await db.classSession.create({
      data: {
        classDefinitionSlug: "integration-cutoff-waitlist-emails",
        titleSnapshot: "Integration Waitlist Emails",
        typeSnapshot: "Yoga",
        levelSnapshot: "All levels",
        durationMinutes: 45,
        startsAtUtc: startsAt,
        endsAtUtc: endsAt,
        timezone: "Europe/London",
        capacity: 1,
        status: ClassSessionStatus.scheduled,
        instructorUserId: instructor.id,
      },
    });

    await bookClassSession(session.id, attendee.id);
    vi.clearAllMocks();

    const waitlistResult = await bookClassSession(session.id, waitlisted.id);

    expect(waitlistResult).toMatchObject({
      status: "waitlisted",
      position: 1,
      bookingMode: "waitlist",
    });
    expect(sendWaitlistJoinedEmailMock).toHaveBeenCalledWith(
      waitlisted.email,
      "Joel",
      "Integration Waitlist Emails",
      expect.any(String),
      expect.any(String),
      startsAt,
      45,
      1,
      {
        timezone: "Europe/London",
        dateFormat: "DD/MM/YYYY",
      }
    );

    vi.clearAllMocks();
    const cancellation = await cancelOwnBooking(session.id, attendee.id);

    expect(cancellation.promotedUserId).toBe(waitlisted.id);
    expect(sendWaitlistPromotedEmailMock).toHaveBeenCalledWith(
      waitlisted.email,
      "Joel",
      "Integration Waitlist Emails",
      expect.any(String),
      expect.any(String),
      startsAt,
      45,
      {
        timezone: "Europe/London",
        dateFormat: "DD/MM/YYYY",
      }
    );
    expect(sendBookingConfirmationMock).not.toHaveBeenCalled();
  });

  it("treats concurrent duplicate booking attempts as one booking", async () => {
    const instructor = await createUser("instructor", "Shruti", "admin");
    const member = await createUser("member", "Ava");
    const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 45 * 60 * 1000);

    await db.membershipSubscription.create({
      data: {
        id: `membership-${member.id}`,
        userId: member.id,
        plan: MembershipPlan.movewell,
        status: MembershipStatus.active,
        pricePence: 2900,
        currency: "GBP",
        classesPerWeek: 3,
        classesUsedThisWeek: 0,
        startsAt: new Date("2026-03-01T00:00:00.000Z"),
        renewsAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    });

    const session = await db.classSession.create({
      data: {
        classDefinitionSlug: "integration-cutoff-duplicate-booking",
        titleSnapshot: "Integration Duplicate Booking",
        typeSnapshot: "Strength",
        levelSnapshot: "Adaptive",
        durationMinutes: 45,
        startsAtUtc: startsAt,
        endsAtUtc: endsAt,
        timezone: "Europe/London",
        capacity: 10,
        status: ClassSessionStatus.scheduled,
        instructorUserId: instructor.id,
        instructorNameSnapshot: "Shruti Turner",
      },
    });

    const [first, second] = await Promise.all([
      bookClassSession(session.id, member.id),
      bookClassSession(session.id, member.id),
    ]);

    expect(first.status).toBe("booked");
    expect(second.status).toBe("booked");
    if (first.status === "booked" && second.status === "booked") {
      expect(second.bookingId).toBe(first.bookingId);
    }
    await expect(
      db.classBooking.count({
        where: { sessionId: session.id, userId: member.id, status: ClassBookingStatus.booked },
      })
    ).resolves.toBe(1);
    await expect(
      db.membershipSubscription.findUniqueOrThrow({ where: { id: `membership-${member.id}` } })
    ).resolves.toMatchObject({ classesUsedThisWeek: 1 });
  });

  it("branches at the configured empty-class cutoff by cancelling empty classes and reminding booked attendees", async () => {
    const now = new Date("2026-03-24T12:00:00.000Z");
    const instructor = await createUser("instructor", "Shruti", "admin");
    const member = await createUser("member", "Nina");

    await db.classOperationalSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        preJoinWindowMinutes: 10,
        lateJoinCutoffMinutes: 5,
        creditRefundWindowMinutes: 180,
        emptyClassAutoCancelWindowMinutes: 60,
      },
      update: {
        preJoinWindowMinutes: 10,
        lateJoinCutoffMinutes: 5,
        creditRefundWindowMinutes: 180,
        emptyClassAutoCancelWindowMinutes: 60,
      },
    });

    const cancelledSession = await db.classSession.create({
      data: {
        classDefinitionSlug: "integration-cutoff-empty",
        titleSnapshot: "Integration Empty Class",
        typeSnapshot: "Yoga",
        levelSnapshot: "All levels",
        durationMinutes: 60,
        startsAtUtc: new Date("2026-03-24T12:45:00.000Z"),
        endsAtUtc: new Date("2026-03-24T13:45:00.000Z"),
        timezone: "Europe/London",
        capacity: 8,
        status: ClassSessionStatus.scheduled,
        instructorUserId: instructor.id,
      },
    });

    const reminderSession = await db.classSession.create({
      data: {
        classDefinitionSlug: "integration-cutoff-booked",
        titleSnapshot: "Integration Reminder Class",
        typeSnapshot: "Strength",
        levelSnapshot: "Adaptive",
        durationMinutes: 45,
        startsAtUtc: new Date("2026-03-24T12:50:00.000Z"),
        endsAtUtc: new Date("2026-03-24T13:35:00.000Z"),
        timezone: "Europe/London",
        capacity: 8,
        status: ClassSessionStatus.scheduled,
        instructorUserId: instructor.id,
      },
    });

    await db.classBooking.create({
      data: {
        sessionId: reminderSession.id,
        userId: member.id,
        status: ClassBookingStatus.booked,
        entitlementType: BookingEntitlementType.manual,
      },
    });

    const result = await processThreeHourClassCutoff(now);

    expect(result).toEqual({
      cancelledCount: 1,
      remindedCount: 1,
      processedSessionCount: 2,
    });

    const [cancelledRow, reminderRow] = await Promise.all([
      db.classSession.findUniqueOrThrow({
        where: { id: cancelledSession.id },
        select: {
          status: true,
          autoCancelledForNoAttendanceAt: true,
          reminderProcessedAt: true,
        },
      }),
      db.classSession.findUniqueOrThrow({
        where: { id: reminderSession.id },
        select: {
          status: true,
          autoCancelledForNoAttendanceAt: true,
          reminderProcessedAt: true,
        },
      }),
    ]);

    expect(cancelledRow.status).toBe(ClassSessionStatus.cancelled);
    expect(cancelledRow.autoCancelledForNoAttendanceAt?.toISOString()).toBe(now.toISOString());
    expect(cancelledRow.reminderProcessedAt?.toISOString()).toBe(now.toISOString());
    expect(reminderRow.status).toBe(ClassSessionStatus.scheduled);
    expect(reminderRow.autoCancelledForNoAttendanceAt).toBeNull();
    expect(reminderRow.reminderProcessedAt?.toISOString()).toBe(now.toISOString());
    expect(sendInstructorNotificationMock).toHaveBeenCalledWith(
      instructor.email,
      "no-attendance-cancelled",
      "Integration Empty Class",
      expect.any(String),
      expect.any(String),
      "No attendees",
      0,
      expect.any(Date),
      60
    );
    expect(sendClassReminderMock).toHaveBeenCalledTimes(1);
    expect(sendClassReminderMock).toHaveBeenCalledWith(
      member.email,
      "Nina",
      "Integration Reminder Class",
      "12:50",
      expect.stringContaining(
        `/dashboard/classes/${reminderSession.classDefinitionSlug}/join?sessionId=${reminderSession.id}`
      ),
      {
        timezone: "Europe/London",
        dateFormat: "DD/MM/YYYY",
      },
      {
        preJoinWindowMinutes: 10,
        lateJoinCutoffMinutes: 5,
      }
    );
  });

  it("auto-cancels the session if the last attendee cancels inside the three-hour window", async () => {
    const instructor = await createUser("instructor", "Shruti", "admin");
    const ownerAdmin = await createUser("owner-admin", "Owner", "owner_admin");
    const attendee = await createUser("attendee", "Mia");
    const waitlisted = await createUser("waitlisted", "Joel");

    const session = await db.classSession.create({
      data: {
        classDefinitionSlug: "integration-cutoff-last-cancel",
        titleSnapshot: "Integration Last Cancel",
        typeSnapshot: "Yoga",
        levelSnapshot: "All levels",
        durationMinutes: 60,
        startsAtUtc: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endsAtUtc: new Date(Date.now() + 3 * 60 * 60 * 1000),
        timezone: "Europe/London",
        capacity: 8,
        status: ClassSessionStatus.scheduled,
        instructorUserId: instructor.id,
      },
    });

    await db.classBooking.create({
      data: {
        sessionId: session.id,
        userId: attendee.id,
        status: ClassBookingStatus.booked,
        entitlementType: BookingEntitlementType.manual,
      },
    });
    await db.classWaitlistEntry.create({
      data: {
        sessionId: session.id,
        userId: waitlisted.id,
        status: ClassWaitlistStatus.waiting,
        position: 1,
      },
    });

    const result = await cancelOwnBooking(session.id, attendee.id);

    expect(result).toEqual({
      cancelled: true,
      promotedUserId: null,
      refundedCredit: false,
      autoCancelledForNoAttendance: true,
    });

    const refreshedSession = await db.classSession.findUniqueOrThrow({
      where: { id: session.id },
      select: {
        status: true,
        autoCancelledForNoAttendanceAt: true,
      },
    });
    const refreshedWaitlist = await db.classWaitlistEntry.findUniqueOrThrow({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId: waitlisted.id,
        },
      },
      select: {
        status: true,
      },
    });

    expect(refreshedSession.status).toBe(ClassSessionStatus.cancelled);
    expect(refreshedSession.autoCancelledForNoAttendanceAt).not.toBeNull();
    expect(refreshedWaitlist.status).toBe(ClassWaitlistStatus.removed);
    expect(sendInstructorNotificationMock).toHaveBeenCalledWith(
      instructor.email,
      "no-attendance-cancelled",
      "Integration Last Cancel",
      expect.any(String),
      expect.any(String),
      "No attendees",
      0,
      expect.any(Date),
      60
    );
    expect(sendInstructorNotificationMock).toHaveBeenCalledWith(
      ownerAdmin.email,
      "no-attendance-cancelled",
      "Integration Last Cancel",
      expect.any(String),
      expect.any(String),
      "No attendees",
      0,
      expect.any(Date),
      60
    );
  });
});
