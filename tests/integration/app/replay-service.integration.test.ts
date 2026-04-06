import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  ReplayAssetStatus,
  ReplayEntitlementAccessType,
  SmallGroupEnrollmentStatus,
  SmallGroupProgrammeStatus,
  SmallGroupSessionStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import {
  deleteReplayAssetNow,
  getReplayPlaybackAccess,
  revokeReplayEntitlement,
} from "@/lib/replay/service";

const USER_PREFIX = "integration-replay-user-";
const PROGRAMME_PREFIX = "integration-replay-programme-";
const SESSION_PREFIX = "integration-replay-session-";
const CLASS_PREFIX = "integration-replay-class-";

async function cleanupRows() {
  await db.adminActionLog.deleteMany({
    where: {
      OR: [{ targetType: "replay_asset" }, { targetType: "replay_entitlement" }],
    },
  });
  await db.replayEntitlement.deleteMany({
    where: {
      user: {
        email: {
          startsWith: USER_PREFIX,
        },
      },
    },
  });
  await db.replayAsset.deleteMany({
    where: {
      OR: [
        {
          smallGroupProgrammeSession: {
            title: {
              startsWith: SESSION_PREFIX,
            },
          },
        },
        {
          classSession: {
            classDefinitionSlug: {
              startsWith: CLASS_PREFIX,
            },
          },
        },
      ],
    },
  });
  await db.smallGroupProgrammeSession.deleteMany({
    where: {
      title: {
        startsWith: SESSION_PREFIX,
      },
    },
  });
  await db.smallGroupProgramme.deleteMany({
    where: {
      slug: {
        startsWith: PROGRAMME_PREFIX,
      },
    },
  });
  await db.classSession.deleteMany({
    where: {
      classDefinitionSlug: {
        startsWith: CLASS_PREFIX,
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

function makeEmail(label: string) {
  return `${USER_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function createProgrammeReplayFixture() {
  const owner = await db.user.create({
    data: {
      email: makeEmail("owner"),
      firstName: "Shruti",
      lastName: "Owner",
      role: "owner_admin",
    },
  });
  const member = await db.user.create({
    data: {
      email: makeEmail("member"),
      firstName: "Sam",
      lastName: "Student",
    },
  });

  const programme = await db.smallGroupProgramme.create({
    data: {
      slug: `${PROGRAMME_PREFIX}${Date.now()}`,
      runSlug: `${PROGRAMME_PREFIX}run-${Date.now()}`,
      templateSlug: "shoulder-resilience",
      title: "Shoulder Resilience",
      shortDescription: "Programme replay test fixture",
      description: "Programme replay test fixture",
      durationLabel: "6 weeks",
      durationWeeks: 6,
      cohortSize: 8,
      startDate: new Date("2026-03-01T18:00:00.000Z"),
      endDate: new Date("2026-04-12T19:00:00.000Z"),
      scheduleLabel: "Sundays at 18:00",
      pricePence: 12000,
      status: SmallGroupProgrammeStatus.open,
      totalSessions: 1,
      replayAvailable: true,
      isRecorded: true,
    },
  });

  const session = await db.smallGroupProgrammeSession.create({
    data: {
      programmeId: programme.id,
      title: `${SESSION_PREFIX}${Date.now()}`,
      startsAt: new Date("2026-03-02T18:00:00.000Z"),
      endsAt: new Date("2026-03-02T19:00:00.000Z"),
      sequenceNumber: 1,
      status: SmallGroupSessionStatus.completed,
    },
  });

  await db.smallGroupProgrammeEnrollment.create({
    data: {
      programmeId: programme.id,
      userId: member.id,
      attendeeName: "Sam Student",
      attendeeEmail: member.email,
      status: SmallGroupEnrollmentStatus.active,
      pricePaidPence: 12000,
      currency: "GBP",
    },
  });

  const replayAsset = await db.replayAsset.create({
    data: {
      resourceType: "small_group_programme_session",
      smallGroupProgrammeId: programme.id,
      smallGroupProgrammeSessionId: session.id,
      status: ReplayAssetStatus.ready,
      playbackUrl: "https://daily.example/playback/replay_456",
      deleteAfterAt: new Date("2026-05-24T19:00:00.000Z"),
    },
  });

  await db.replayEntitlement.create({
    data: {
      replayAssetId: replayAsset.id,
      userId: member.id,
      accessType: ReplayEntitlementAccessType.participant,
      startsAt: new Date("2026-03-02T19:00:00.000Z"),
      endsAt: new Date("2026-05-24T19:00:00.000Z"),
    },
  });

  return { owner, member, programme, session, replayAsset };
}

describe("replay service", () => {
  beforeEach(async () => {
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("blocks playback for legacy standard-class replay assets", async () => {
    const member = await db.user.create({
      data: {
        email: makeEmail("class-member"),
        firstName: "Nina",
        lastName: "Member",
      },
    });
    const instructor = await db.user.create({
      data: {
        email: makeEmail("class-instructor"),
        firstName: "Casey",
        lastName: "Teacher",
      },
    });
    const classSession = await db.classSession.create({
      data: {
        classDefinitionSlug: `${CLASS_PREFIX}${Date.now()}`,
        titleSnapshot: "Legacy Recorded Strength",
        typeSnapshot: "Strength",
        levelSnapshot: "Adaptive",
        durationMinutes: 45,
        startsAtUtc: new Date("2026-03-01T18:00:00.000Z"),
        endsAtUtc: new Date("2026-03-01T18:45:00.000Z"),
        timezone: "Europe/London",
        capacity: 8,
        instructor: {
          connect: {
            id: instructor.id,
          },
        },
        isRecorded: true,
        replayAvailable: true,
      },
    });
    const replayAsset = await db.replayAsset.create({
      data: {
        resourceType: "class_session",
        classSessionId: classSession.id,
        status: ReplayAssetStatus.ready,
        playbackUrl: "https://daily.example/playback/class_legacy",
      },
    });
    await db.replayEntitlement.create({
      data: {
        replayAssetId: replayAsset.id,
        userId: member.id,
        accessType: ReplayEntitlementAccessType.participant,
        startsAt: new Date("2026-03-01T18:45:00.000Z"),
        endsAt: new Date("2026-03-08T18:45:00.000Z"),
      },
    });

    await expect(getReplayPlaybackAccess(replayAsset.id, member.id)).rejects.toThrow(
      "REPLAY_NOT_AVAILABLE"
    );
  });

  it("supports owner-admin actions on small-group replay assets only", async () => {
    const { owner, member, replayAsset } = await createProgrammeReplayFixture();

    await revokeReplayEntitlement({
      replayAssetId: replayAsset.id,
      userId: member.id,
      actorUserId: owner.id,
      reason: "Chargeback review",
      accessType: ReplayEntitlementAccessType.participant,
    });
    await getReplayPlaybackAccess(replayAsset.id, owner.id);
    await deleteReplayAssetNow(replayAsset.id, owner.id);

    const logs = await db.adminActionLog.findMany({
      where: {
        actorUserId: owner.id,
      },
      orderBy: { createdAt: "asc" },
      select: {
        actionType: true,
        targetType: true,
      },
    });

    expect(logs).toEqual(
      expect.arrayContaining([
        {
          actionType: "replay_entitlement_revoked",
          targetType: "replay_entitlement",
        },
        {
          actionType: "replay_playback_opened",
          targetType: "replay_asset",
        },
        {
          actionType: "replay_deleted",
          targetType: "replay_asset",
        },
      ])
    );
  });
});
