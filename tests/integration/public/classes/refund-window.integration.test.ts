import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AcceptanceType,
  ClassBookingStatus,
  ClassSessionStatus,
  CreditEntryType,
} from "@prisma/client";
import { CURRENT_HEALTH_DATA_CONSENT_VERSION } from "@/data/legal-documents";
import { db } from "@/lib/db";
import { addCredits, getCreditBalance } from "@/lib/credits/credit-service";
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

import { bookClassSession, cancelOwnBooking } from "@/lib/classes/booking-service";

const USER_PREFIX = "integration-refund-window-";

async function cleanupRows() {
  await db.classOperationalSettings.deleteMany({
    where: { id: "default" },
  });
  await db.classAttendanceEvent.deleteMany({
    where: {
      session: {
        classDefinitionSlug: {
          startsWith: "integration-refund-window-",
        },
      },
    },
  });
  await db.classBooking.deleteMany({
    where: {
      session: {
        classDefinitionSlug: {
          startsWith: "integration-refund-window-",
        },
      },
    },
  });
  await db.classSession.deleteMany({
    where: {
      classDefinitionSlug: {
        startsWith: "integration-refund-window-",
      },
    },
  });
  await db.creditLedgerEntry.deleteMany({
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

async function createUser(label: string, firstName: string) {
  const user = await db.user.create({
    data: {
      email: createUserEmail(label),
      firstName,
      lastName: "Integration",
      name: `${firstName} Integration`,
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

describe("class booking refund window", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupRows();
    await db.classOperationalSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        preJoinWindowMinutes: 10,
        lateJoinCutoffMinutes: 5,
        creditRefundWindowMinutes: 180,
        emptyClassAutoCancelWindowMinutes: 180,
      },
      update: {
        preJoinWindowMinutes: 10,
        lateJoinCutoffMinutes: 5,
        creditRefundWindowMinutes: 180,
        emptyClassAutoCancelWindowMinutes: 180,
      },
    });
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("refunds a credit when the member cancels before the configured refund window", async () => {
    const instructor = await createUser("instructor", "Shruti");
    const member = await createUser("member", "Nina");
    await addCredits({
      userId: member.id,
      amount: 1,
      description: "Test purchase",
      sourceRef: "test:before-window",
      type: CreditEntryType.purchase,
    });

    const session = await db.classSession.create({
      data: {
        classDefinitionSlug: "integration-refund-window-refund",
        titleSnapshot: "Refund Window Strength",
        typeSnapshot: "Strength",
        levelSnapshot: "Adaptive",
        durationMinutes: 45,
        startsAtUtc: new Date(Date.now() + 5 * 60 * 60 * 1000),
        endsAtUtc: new Date(Date.now() + 6 * 60 * 60 * 1000),
        timezone: "Europe/London",
        capacity: 8,
        status: ClassSessionStatus.scheduled,
        instructorUserId: instructor.id,
      },
    });

    await bookClassSession(session.id, member.id);
    const result = await cancelOwnBooking(session.id, member.id);

    expect(result.refundedCredit).toBe(true);
    expect(await getCreditBalance(member.id)).toBe(1);
    expect(sendClassUnbookingMock).toHaveBeenCalledTimes(1);
  });

  it("does not refund a credit when the member cancels inside the configured refund window", async () => {
    const instructor = await createUser("instructor", "Shruti");
    const member = await createUser("member", "Mia");
    await addCredits({
      userId: member.id,
      amount: 1,
      description: "Test purchase",
      sourceRef: "test:inside-window",
      type: CreditEntryType.purchase,
    });

    const session = await db.classSession.create({
      data: {
        classDefinitionSlug: "integration-refund-window-no-refund",
        titleSnapshot: "No Refund Window Strength",
        typeSnapshot: "Strength",
        levelSnapshot: "Adaptive",
        durationMinutes: 45,
        startsAtUtc: new Date(Date.now() + 30 * 60 * 1000),
        endsAtUtc: new Date(Date.now() + 75 * 60 * 1000),
        timezone: "Europe/London",
        capacity: 8,
        status: ClassSessionStatus.scheduled,
        instructorUserId: instructor.id,
      },
    });

    await bookClassSession(session.id, member.id);
    const result = await cancelOwnBooking(session.id, member.id);

    expect(result.refundedCredit).toBe(false);
    expect(await getCreditBalance(member.id)).toBe(0);
    expect(sendClassUnbookingMock).toHaveBeenCalledTimes(1);

    const booking = await db.classBooking.findFirstOrThrow({
      where: {
        sessionId: session.id,
        userId: member.id,
      },
      select: {
        status: true,
      },
    });
    expect(booking.status).toBe(ClassBookingStatus.cancelled);
  });
});
