import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AcceptanceType,
  ClassRoomSetupStatus,
  ClassSessionStatus,
  CreditEntryType,
} from "@prisma/client";
import { CURRENT_HEALTH_DATA_CONSENT_VERSION } from "@/data/legal-documents";
import { db } from "@/lib/db";
import { addCredits } from "@/lib/credits/credit-service";
import { recordAcceptanceEvent } from "@/lib/legal/acceptance-service";

const {
  createSessionRoomMock,
  deleteSessionRoomMock,
  isDailyConfiguredMock,
  sendBookingConfirmationMock,
  sendClassCancellationMock,
  sendClassUnbookingMock,
  sendClassReminderMock,
  sendInstructorNotificationMock,
  sendWaitlistJoinedEmailMock,
  sendWaitlistPromotedEmailMock,
} = vi.hoisted(() => ({
  createSessionRoomMock: vi.fn(),
  deleteSessionRoomMock: vi.fn(),
  isDailyConfiguredMock: vi.fn(),
  sendBookingConfirmationMock: vi.fn().mockResolvedValue({ success: true }),
  sendClassCancellationMock: vi.fn().mockResolvedValue({ success: true }),
  sendClassUnbookingMock: vi.fn().mockResolvedValue({ success: true }),
  sendClassReminderMock: vi.fn().mockResolvedValue({ success: true }),
  sendInstructorNotificationMock: vi.fn().mockResolvedValue({ success: true }),
  sendWaitlistJoinedEmailMock: vi.fn().mockResolvedValue({ success: true }),
  sendWaitlistPromotedEmailMock: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/daily/service", () => ({
  createSessionRoom: createSessionRoomMock,
  deleteSessionRoom: deleteSessionRoomMock,
  isDailyConfigured: isDailyConfiguredMock,
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

import { bookClassSession, cancelClassSession } from "@/lib/classes/booking-service";

const USER_PREFIX = "integration-room-lifecycle-";

async function cleanupRows() {
  await db.classAttendanceEvent.deleteMany({
    where: {
      session: {
        classDefinitionSlug: {
          startsWith: "integration-room-lifecycle-",
        },
      },
    },
  });
  await db.classBooking.deleteMany({
    where: {
      session: {
        classDefinitionSlug: {
          startsWith: "integration-room-lifecycle-",
        },
      },
    },
  });
  await db.classSession.deleteMany({
    where: {
      classDefinitionSlug: {
        startsWith: "integration-room-lifecycle-",
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

describe("Daily room lifecycle for class sessions", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupRows();
    isDailyConfiguredMock.mockReturnValue(true);
    createSessionRoomMock.mockResolvedValue({
      roomName: "integration-room",
      roomUrl: "https://daily.example/integration-room",
    });
    deleteSessionRoomMock.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("creates the Daily room when the first attendee books", async () => {
    const instructor = await db.user.create({
      data: {
        email: createUserEmail("instructor"),
        firstName: "Shruti",
        lastName: "Turner",
      },
    });
    const member = await db.user.create({
      data: {
        email: createUserEmail("member"),
        firstName: "Nina",
        lastName: "Member",
        isOnboarded: true,
        hasConsentedToHealthData: true,
        acceptedHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
        healthDataConsentedAt: new Date(),
      },
    });

    await db.healthProfile.create({
      data: {
        userId: member.id,
        declarationStatus: "none_declared",
      },
    });

    for (const type of [
      AcceptanceType.terms,
      AcceptanceType.health_waiver,
      AcceptanceType.health_data,
    ]) {
      await recordAcceptanceEvent({
        userId: member.id,
        type,
        surface: "class_booking",
      });
    }

    await addCredits({
      userId: member.id,
      amount: 1,
      description: "Room lifecycle test",
      sourceRef: "test:room-lifecycle:first-booking",
      type: CreditEntryType.purchase,
    });

    const session = await db.classSession.create({
      data: {
        classDefinitionSlug: "integration-room-lifecycle-strength",
        titleSnapshot: "Room Lifecycle Strength",
        typeSnapshot: "Strength",
        levelSnapshot: "Adaptive",
        durationMinutes: 45,
        startsAtUtc: new Date(Date.now() + 5 * 60 * 60 * 1000),
        endsAtUtc: new Date(Date.now() + 6 * 60 * 60 * 1000),
        timezone: "Europe/London",
        capacity: 8,
        status: ClassSessionStatus.scheduled,
        instructorUserId: instructor.id,
        roomSetupStatus: ClassRoomSetupStatus.pending,
      },
    });

    await bookClassSession(session.id, member.id);

    expect(createSessionRoomMock).toHaveBeenCalledTimes(1);

    const refreshed = await db.classSession.findUniqueOrThrow({
      where: { id: session.id },
      select: {
        dailyRoomName: true,
        dailyRoomUrl: true,
        roomSetupStatus: true,
      },
    });

    expect(refreshed).toEqual({
      dailyRoomName: "integration-room",
      dailyRoomUrl: "https://daily.example/integration-room",
      roomSetupStatus: ClassRoomSetupStatus.ready,
    });
  });

  it("closes the Daily room when the session is cancelled", async () => {
    const instructor = await db.user.create({
      data: {
        email: createUserEmail("instructor-cancel"),
        firstName: "Shruti",
        lastName: "Turner",
      },
    });
    const attendee = await db.user.create({
      data: {
        email: createUserEmail("attendee"),
        firstName: "Alex",
        lastName: "Attendee",
        isOnboarded: true,
        hasConsentedToHealthData: true,
        acceptedHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
        healthDataConsentedAt: new Date(),
      },
    });

    await db.healthProfile.create({
      data: {
        userId: attendee.id,
        declarationStatus: "none_declared",
      },
    });

    const session = await db.classSession.create({
      data: {
        classDefinitionSlug: "integration-room-lifecycle-cancel",
        titleSnapshot: "Room Lifecycle Cancel",
        typeSnapshot: "Strength",
        levelSnapshot: "Adaptive",
        durationMinutes: 45,
        startsAtUtc: new Date(Date.now() + 5 * 60 * 60 * 1000),
        endsAtUtc: new Date(Date.now() + 6 * 60 * 60 * 1000),
        timezone: "Europe/London",
        capacity: 8,
        status: ClassSessionStatus.scheduled,
        instructorUserId: instructor.id,
        dailyRoomName: "integration-room",
        dailyRoomUrl: "https://daily.example/integration-room",
        roomSetupStatus: ClassRoomSetupStatus.ready,
        bookings: {
          create: {
            userId: attendee.id,
            status: "booked",
          },
        },
      },
    });

    await cancelClassSession(session.id, instructor.id, "Instructor cancelled");

    expect(deleteSessionRoomMock).toHaveBeenCalledWith("integration-room");
    expect(sendClassCancellationMock).toHaveBeenCalledTimes(1);

    const refreshed = await db.classSession.findUniqueOrThrow({
      where: { id: session.id },
      select: {
        dailyRoomName: true,
        dailyRoomUrl: true,
        roomSetupStatus: true,
        status: true,
      },
    });

    expect(refreshed).toEqual({
      dailyRoomName: null,
      dailyRoomUrl: null,
      roomSetupStatus: ClassRoomSetupStatus.pending,
      status: ClassSessionStatus.cancelled,
    });
  });
});
