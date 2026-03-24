import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ClassSessionStatus } from "@prisma/client";
import { db } from "@/lib/db";

const {
  sendBookingConfirmationMock,
  sendClassCancellationMock,
  sendClassReminderMock,
  sendInstructorNotificationMock,
} = vi.hoisted(() => ({
  sendBookingConfirmationMock: vi.fn().mockResolvedValue({ success: true }),
  sendClassCancellationMock: vi.fn().mockResolvedValue({ success: true }),
  sendClassReminderMock: vi.fn().mockResolvedValue({ success: true }),
  sendInstructorNotificationMock: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/email", () => ({
  sendBookingConfirmation: sendBookingConfirmationMock,
  sendClassCancellation: sendClassCancellationMock,
  sendClassReminder: sendClassReminderMock,
  sendInstructorNotification: sendInstructorNotificationMock,
}));

import { cancelClassSessionsForWeek } from "@/lib/classes/booking-service";

const USER_PREFIX = "integration-class-week-cancel-";

async function cleanupRows() {
  await db.classSession.deleteMany({
    where: {
      classDefinitionSlug: {
        startsWith: "integration-class-week-cancel-",
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

describe("cancelClassSessionsForWeek", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("cancels only future draft and scheduled sessions in the selected week", async () => {
    const admin = await db.user.create({
      data: {
        email: createUserEmail("admin"),
        firstName: "Ada",
        lastName: "Admin",
        role: "admin",
      },
    });

    const baseData = {
      titleSnapshot: "Week Cancel Test",
      typeSnapshot: "Strength",
      levelSnapshot: "Adaptive",
      durationMinutes: 45,
      timezone: "Europe/London",
      capacity: 10,
      instructorUserId: admin.id,
    };

    const [draftSession, scheduledSession, liveSession, completedSession, cancelledSession] =
      await Promise.all([
        db.classSession.create({
          data: {
            ...baseData,
            classDefinitionSlug: "integration-class-week-cancel-draft",
            localDate: new Date("2030-03-25T00:00:00.000Z"),
            startsAtUtc: new Date("2030-03-25T09:00:00.000Z"),
            endsAtUtc: new Date("2030-03-25T09:45:00.000Z"),
            status: ClassSessionStatus.draft,
          },
        }),
        db.classSession.create({
          data: {
            ...baseData,
            classDefinitionSlug: "integration-class-week-cancel-scheduled",
            localDate: new Date("2030-03-26T00:00:00.000Z"),
            startsAtUtc: new Date("2030-03-26T09:00:00.000Z"),
            endsAtUtc: new Date("2030-03-26T09:45:00.000Z"),
            status: ClassSessionStatus.scheduled,
          },
        }),
        db.classSession.create({
          data: {
            ...baseData,
            classDefinitionSlug: "integration-class-week-cancel-live",
            localDate: new Date("2030-03-27T00:00:00.000Z"),
            startsAtUtc: new Date("2030-03-27T09:00:00.000Z"),
            endsAtUtc: new Date("2030-03-27T09:45:00.000Z"),
            status: ClassSessionStatus.live,
          },
        }),
        db.classSession.create({
          data: {
            ...baseData,
            classDefinitionSlug: "integration-class-week-cancel-completed",
            localDate: new Date("2030-03-28T00:00:00.000Z"),
            startsAtUtc: new Date("2030-03-20T09:00:00.000Z"),
            endsAtUtc: new Date("2030-03-20T09:45:00.000Z"),
            status: ClassSessionStatus.completed,
          },
        }),
        db.classSession.create({
          data: {
            ...baseData,
            classDefinitionSlug: "integration-class-week-cancel-cancelled",
            localDate: new Date("2030-03-29T00:00:00.000Z"),
            startsAtUtc: new Date("2030-03-29T09:00:00.000Z"),
            endsAtUtc: new Date("2030-03-29T09:45:00.000Z"),
            status: ClassSessionStatus.cancelled,
          },
        }),
      ]);

    const result = await cancelClassSessionsForWeek({
      weekStart: "2030-03-25",
      cancelledByUserId: admin.id,
      reason: "Weekly reset",
    });

    expect(result).toEqual({
      weekStart: "2030-03-25",
      weekEndExclusive: "2030-04-01",
      cancelledCount: 2,
      skippedCount: 3,
    });

    const statuses = await db.classSession.findMany({
      where: {
        id: {
          in: [
            draftSession.id,
            scheduledSession.id,
            liveSession.id,
            completedSession.id,
            cancelledSession.id,
          ],
        },
      },
      select: {
        id: true,
        status: true,
      },
    });
    const statusById = new Map(statuses.map((row) => [row.id, row.status]));

    expect(statusById.get(draftSession.id)).toBe(ClassSessionStatus.cancelled);
    expect(statusById.get(scheduledSession.id)).toBe(ClassSessionStatus.cancelled);
    expect(statusById.get(liveSession.id)).toBe(ClassSessionStatus.live);
    expect(statusById.get(completedSession.id)).toBe(ClassSessionStatus.completed);
    expect(statusById.get(cancelledSession.id)).toBe(ClassSessionStatus.cancelled);
  });
});
