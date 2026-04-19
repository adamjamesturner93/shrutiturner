import { db } from "@/lib/db";
import { recordUserLifecycleEvent } from "@/lib/user-lifecycle";

const DEFAULT_RETENTION_MONTHS = 6;

function subtractMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() - months);
  return next;
}

export async function processHealthDataRetention(now = new Date()) {
  const cutoff = subtractMonths(now, DEFAULT_RETENTION_MONTHS);
  const profiles = await db.healthProfile.findMany({
    include: {
      user: {
        select: { id: true, legalHoldUntil: true, deletedAt: true },
      },
      revisions: {
        select: { id: true },
      },
    },
  });

  let deletedProfiles = 0;
  let clearedRetreatBookings = 0;
  let clearedCoachingCheckIns = 0;
  let purgedDeletedUsers = 0;
  let purgedAcceptanceEvents = 0;

  for (const profile of profiles) {
    if (profile.user.legalHoldUntil && profile.user.legalHoldUntil > now) {
      continue;
    }
    if (profile.user.deletedAt) {
      continue;
    }

    const latestAttendance = await db.classBooking.findFirst({
      where: {
        userId: profile.userId,
        status: "attended",
      },
      orderBy: {
        session: {
          startsAtUtc: "desc",
        },
      },
      select: {
        session: {
          select: { startsAtUtc: true },
        },
      },
    });
    const retentionAnchor =
      latestAttendance?.session.startsAtUtc &&
      latestAttendance.session.startsAtUtc > profile.lastUpdatedAt
        ? latestAttendance.session.startsAtUtc
        : profile.lastUpdatedAt;

    if (retentionAnchor > cutoff) {
      continue;
    }

    await db.$transaction(async (tx) => {
      await tx.healthProfileRevision.deleteMany({
        where: { profileId: profile.id },
      });
      await tx.healthConditionSelection.deleteMany({
        where: { profileId: profile.id },
      });
      await tx.healthProfile.delete({
        where: { id: profile.id },
      });
      deletedProfiles += 1;
    });
  }

  const retreatDates = await db.retreatDate.findMany({
    where: {
      endsAt: {
        lte: cutoff,
      },
    },
    select: { id: true },
  });
  for (const retreatDate of retreatDates) {
    const updated = await db.retreatBooking.updateMany({
      where: {
        retreatDateId: retreatDate.id,
      },
      data: {
        dietaryRequirements: null,
        medicalConditions: null,
        mobilityNeeds: null,
        guestTwoDietaryRequirements: null,
      },
    });
    clearedRetreatBookings += updated.count;
  }

  const coachingProfiles = await db.coachingClientProfile.findMany({
    where: {
      updatedAt: {
        lte: cutoff,
      },
    },
    select: { id: true },
  });
  for (const coachingProfile of coachingProfiles) {
    const updated = await db.coachingCheckIn.updateMany({
      where: { clientProfileId: coachingProfile.id },
      data: {
        answersJson: null,
      },
    });
    clearedCoachingCheckIns += updated.count;
  }

  const deletedUsers = await db.user.findMany({
    where: {
      deletedAt: {
        lte: cutoff,
      },
      OR: [{ legalHoldUntil: null }, { legalHoldUntil: { lte: now } }],
    },
    select: {
      id: true,
      deletedAt: true,
    },
  });

  for (const user of deletedUsers) {
    const purgeResult = await db.$transaction(async (tx) => {
      const acceptanceEvents = await tx.acceptanceEvent.deleteMany({
        where: { userId: user.id },
      });

      await tx.healthProfileRevision.deleteMany({
        where: {
          profile: {
            userId: user.id,
          },
        },
      });
      await tx.healthConditionSelection.deleteMany({
        where: {
          profile: {
            userId: user.id,
          },
        },
      });
      const profiles = await tx.healthProfile.deleteMany({
        where: { userId: user.id },
      });

      return {
        acceptanceEvents: acceptanceEvents.count,
        profiles: profiles.count,
      };
    });

    purgedDeletedUsers += 1;
    purgedAcceptanceEvents += purgeResult.acceptanceEvents;
    deletedProfiles += purgeResult.profiles;

    await recordUserLifecycleEvent({
      eventType: "user_retention_purged",
      userId: user.id,
      payload: {
        deletedAt: user.deletedAt?.toISOString() || null,
        purgedAt: now.toISOString(),
        acceptanceEventsDeleted: purgeResult.acceptanceEvents,
        healthProfilesDeleted: purgeResult.profiles,
      },
    }).catch(() => null);
  }

  return {
    retentionMonths: DEFAULT_RETENTION_MONTHS,
    deletedProfiles,
    clearedRetreatBookings,
    clearedCoachingCheckIns,
    purgedDeletedUsers,
    purgedAcceptanceEvents,
  };
}
