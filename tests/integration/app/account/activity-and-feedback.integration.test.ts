import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ClassBookingStatus, ClassSessionStatus, PostClassFeeling } from "@prisma/client";
import { CURRENT_HEALTH_DATA_CONSENT_VERSION } from "@/data/legal-documents";
import { getAccountActivity } from "@/lib/account/account-activity-service";
import { saveSessionFeedback } from "@/lib/classes/feedback-service";
import { db } from "@/lib/db";

const USER_PREFIX = "integration-account-activity-";
const SESSION_PREFIX = "integration-account-activity-";

function createEmail(label: string) {
  return `${USER_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function cleanupRows() {
  await db.classAttendanceEvent.deleteMany({
    where: {
      session: {
        classDefinitionSlug: {
          startsWith: SESSION_PREFIX,
        },
      },
    },
  });
  await db.classBooking.deleteMany({
    where: {
      session: {
        classDefinitionSlug: {
          startsWith: SESSION_PREFIX,
        },
      },
    },
  });
  await db.classSession.deleteMany({
    where: {
      classDefinitionSlug: {
        startsWith: SESSION_PREFIX,
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

async function createUser(
  label: string,
  options?: {
    flareTracking?: boolean;
  }
) {
  const user = await db.user.create({
    data: {
      email: createEmail(label),
      firstName: "Member",
      lastName: "Activity",
      name: "Member Activity",
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
    data: options?.flareTracking
      ? {
          userId: user.id,
          declarationStatus: "context_declared",
          tracksFlareCheckIns: true,
          additionalNotes: "Symptoms can flare day to day.",
        }
      : {
          userId: user.id,
          declarationStatus: "none_declared",
        },
  });

  return user;
}

describe("account activity and session feedback", () => {
  beforeEach(async () => {
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("returns the newest attended classes first and caps the activity list at 15 rows", async () => {
    const user = await createUser("history");

    for (let index = 0; index < 16; index += 1) {
      await db.classSession.create({
        data: {
          classDefinitionSlug: `${SESSION_PREFIX}${index}`,
          titleSnapshot: `Class ${index}`,
          typeSnapshot: index % 2 === 0 ? "Yoga" : "Strength",
          levelSnapshot: "Adaptive",
          durationMinutes: 45,
          startsAtUtc: new Date(`2026-02-${String(index + 1).padStart(2, "0")}T18:00:00.000Z`),
          endsAtUtc: new Date(`2026-02-${String(index + 1).padStart(2, "0")}T18:45:00.000Z`),
          timezone: "Europe/London",
          capacity: 10,
          status: ClassSessionStatus.completed,
          instructorUserId: user.id,
          bookings: {
            create: {
              userId: user.id,
              status: ClassBookingStatus.attended,
              preClassFlareToday: index === 15,
              postClassFeeling: index === 15 ? PostClassFeeling.good : null,
            },
          },
        },
      });
    }

    const activity = await getAccountActivity(user.id);

    expect(activity.attendedCount).toBe(16);
    expect(activity.totalCount).toBe(16);
    expect(activity.items).toHaveLength(15);
    expect(activity.items[0]).toMatchObject({
      className: "Class 15",
      flareToday: true,
      postClassFeeling: "good",
    });
    expect(activity.items.at(-1)?.className).toBe("Class 1");
  });

  it("persists pre and post-class feedback onto the member booking", async () => {
    const user = await createUser("feedback", { flareTracking: true });
    const session = await db.classSession.create({
      data: {
        classDefinitionSlug: `${SESSION_PREFIX}feedback`,
        titleSnapshot: "Feedback Session",
        typeSnapshot: "Strength",
        levelSnapshot: "Adaptive",
        durationMinutes: 45,
        startsAtUtc: new Date("2026-03-01T18:00:00.000Z"),
        endsAtUtc: new Date("2026-03-01T18:45:00.000Z"),
        timezone: "Europe/London",
        capacity: 10,
        status: ClassSessionStatus.completed,
        instructorUserId: user.id,
      },
    });

    const booking = await db.classBooking.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        status: ClassBookingStatus.attended,
      },
    });

    await saveSessionFeedback({
      sessionId: session.id,
      userId: user.id,
      input: {
        stage: "pre",
        energyLevel: 2,
        flareToday: true,
      },
    });

    await saveSessionFeedback({
      sessionId: session.id,
      userId: user.id,
      input: {
        stage: "post",
        feeling: "tough",
      },
    });

    const refreshed = await db.classBooking.findUniqueOrThrow({
      where: { id: booking.id },
      select: {
        preClassEnergyLevel: true,
        preClassFlareToday: true,
        preClassSubmittedAt: true,
        postClassFeeling: true,
        postClassSubmittedAt: true,
      },
    });

    expect(refreshed).toMatchObject({
      preClassEnergyLevel: 2,
      preClassFlareToday: true,
      postClassFeeling: PostClassFeeling.tough,
    });
    expect(refreshed.preClassSubmittedAt).not.toBeNull();
    expect(refreshed.postClassSubmittedAt).not.toBeNull();
  });
});
