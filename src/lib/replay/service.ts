import {
  ClassBookingStatus,
  Prisma,
  ReplayAssetStatus,
  ReplayEntitlementAccessType,
} from "@prisma/client";
import { canViewReplayAsset } from "@/lib/authz/access";
import { isOwnerAdminRole } from "@/lib/authz/roles";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import type { ReplayAssetSummaryDto, ReplayPlaybackAccessDto } from "@/lib/api/types";
import { deleteRecording } from "@/lib/daily/service";
import { db } from "@/lib/db";
import { getReplayDisputeHoldState } from "@/lib/billing/dispute-service";
import { resolveReplayPolicyForClassSession } from "@/lib/replay/policy-service";

function now() {
  return new Date();
}

const REPLAY_RESOURCE_TYPES = ["small_group_programme_session", "class_session"] as const;

type ReplayResourceType = (typeof REPLAY_RESOURCE_TYPES)[number];

const replayAssetInclude = {
  classSession: true,
  smallGroupProgrammeSession: {
    include: {
      programme: {
        select: {
          id: true,
          title: true,
          runSlug: true,
        },
      },
    },
  },
} satisfies Prisma.ReplayAssetInclude;

type ReplayAssetWithResource = Prisma.ReplayAssetGetPayload<{
  include: typeof replayAssetInclude;
}>;

function assertSupportedReplayAsset(
  resourceType: string
): asserts resourceType is ReplayResourceType {
  if (!REPLAY_RESOURCE_TYPES.includes(resourceType as ReplayResourceType)) {
    throw new Error("REPLAY_NOT_AVAILABLE");
  }
}

async function getReplayAssetOrThrow(replayAssetId: string) {
  const asset = await db.replayAsset.findUniqueOrThrow({
    where: { id: replayAssetId },
    include: replayAssetInclude,
  });
  assertSupportedReplayAsset(asset.resourceType);
  return asset;
}

function getReplayTitle(asset: {
  classSession?: {
    titleSnapshot: string;
    startsAtUtc: Date;
    endsAtUtc: Date;
  } | null;
  smallGroupProgrammeSession?: {
    title: string;
    sequenceNumber: number;
    startsAt: Date;
    endsAt: Date | null;
    programme: {
      title: string;
    };
  } | null;
}) {
  if (asset.classSession) {
    return {
      title: asset.classSession.titleSnapshot,
      subtitle: "Class replay",
      startsAt: asset.classSession.startsAtUtc.toISOString(),
      endsAt: asset.classSession.endsAtUtc.toISOString(),
    };
  }

  if (!asset.smallGroupProgrammeSession) {
    return { title: "Replay", subtitle: null, startsAt: null, endsAt: null };
  }

  const session = asset.smallGroupProgrammeSession;
  return {
    title: session.programme.title,
    subtitle: `Week ${session.sequenceNumber}: ${session.title}`,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt?.toISOString() || null,
  };
}

function toReplaySummaryDto(input: {
  asset: ReplayAssetWithResource;
  accessType: ReplayEntitlementAccessType | "owner_admin";
  entitlementEndsAt?: Date | null;
}): ReplayAssetSummaryDto {
  const titleData = getReplayTitle(input.asset);
  const isExpired = input.entitlementEndsAt ? input.entitlementEndsAt <= now() : false;

  return {
    id: input.asset.id,
    resourceType: input.asset.resourceType,
    title: titleData.title,
    subtitle: titleData.subtitle,
    startsAt: titleData.startsAt,
    endsAt: titleData.endsAt,
    status: input.asset.status,
    entitlementEndsAt: input.entitlementEndsAt ? input.entitlementEndsAt.toISOString() : null,
    deleteAfterAt: input.asset.deleteAfterAt ? input.asset.deleteAfterAt.toISOString() : null,
    deletedAt: input.asset.deletedAt ? input.asset.deletedAt.toISOString() : null,
    accessType: input.accessType,
    isExpired,
    canPlay:
      input.asset.status === ReplayAssetStatus.ready &&
      Boolean(input.asset.playbackUrl) &&
      !isExpired &&
      input.asset.deletedAt === null,
  };
}

async function assertReplayEntitlementNotBlockedForDispute(userId: string, replayAssetId: string) {
  const asset = await getReplayAssetOrThrow(replayAssetId);
  if (asset.resourceType !== "small_group_programme_session") {
    return;
  }
  const programmeId = asset.smallGroupProgrammeSession?.programmeId;
  if (!programmeId) {
    return;
  }

  const enrollment = await db.smallGroupProgrammeEnrollment.findFirst({
    where: {
      programmeId,
      userId,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!enrollment) {
    return;
  }

  const disputeState = await getReplayDisputeHoldState({
    enrollmentId: enrollment.id,
    userId,
  });
  if (disputeState.resourceBlocked) {
    throw new Error("DISPUTE_HOLD");
  }
}

export async function syncReplayAssetFromDailyWebhook(input: {
  roomName: string;
  recordingId?: string | null;
  playbackUrl?: string | null;
  status?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  payload?: Record<string, unknown> | null;
}) {
  const asset = await db.replayAsset.findFirst({
    where: {
      dailyRoomName: input.roomName,
      resourceType: { in: [...REPLAY_RESOURCE_TYPES] },
    },
  });
  if (!asset) {
    return null;
  }

  const statusToken = (input.status || "").toLowerCase();
  const nextStatus =
    statusToken.includes("fail") || statusToken.includes("error")
      ? ReplayAssetStatus.sync_failed
      : input.playbackUrl
        ? ReplayAssetStatus.ready
        : ReplayAssetStatus.processing;

  const updated = await db.replayAsset.update({
    where: { id: asset.id },
    data: {
      dailyRecordingId: input.recordingId || asset.dailyRecordingId,
      playbackUrl: input.playbackUrl || asset.playbackUrl,
      status: nextStatus,
      startedAt: input.startedAt ? new Date(input.startedAt) : asset.startedAt,
      completedAt: input.completedAt ? new Date(input.completedAt) : asset.completedAt,
      syncError:
        nextStatus === ReplayAssetStatus.sync_failed ? JSON.stringify(input.payload || {}) : null,
    },
  });

  if (updated.resourceType === "class_session" && updated.classSessionId) {
    await createClassReplayEntitlements(updated.id, updated.classSessionId);
  }

  return updated;
}

async function createClassReplayEntitlements(replayAssetId: string, classSessionId: string) {
  const policy = await resolveReplayPolicyForClassSession(classSessionId);
  const session = await db.classSession.findUnique({
    where: { id: classSessionId },
    select: {
      instructorUserId: true,
      bookings: {
        where: {
          status: {
            in: [ClassBookingStatus.booked, ClassBookingStatus.attended],
          },
        },
        select: { userId: true },
      },
    },
  });
  if (!session) return;

  const participantUserIds = Array.from(new Set(session.bookings.map((booking) => booking.userId)));
  await db.$transaction([
    ...participantUserIds.map((userId) =>
      db.replayEntitlement.upsert({
        where: {
          replayAssetId_userId_accessType: {
            replayAssetId,
            userId,
            accessType: ReplayEntitlementAccessType.participant,
          },
        },
        create: {
          replayAssetId,
          userId,
          accessType: ReplayEntitlementAccessType.participant,
          startsAt: policy.entitlementStartsAt,
          endsAt: policy.entitlementEndsAt,
        },
        update: {
          startsAt: policy.entitlementStartsAt,
          endsAt: policy.entitlementEndsAt,
          revokedAt: null,
          revokedByUserId: null,
        },
      })
    ),
    db.replayEntitlement.upsert({
      where: {
        replayAssetId_userId_accessType: {
          replayAssetId,
          userId: session.instructorUserId,
          accessType: ReplayEntitlementAccessType.assigned_instructor,
        },
      },
      create: {
        replayAssetId,
        userId: session.instructorUserId,
        accessType: ReplayEntitlementAccessType.assigned_instructor,
        startsAt: policy.entitlementStartsAt,
        endsAt: policy.entitlementEndsAt,
      },
      update: {
        startsAt: policy.entitlementStartsAt,
        endsAt: policy.entitlementEndsAt,
        revokedAt: null,
        revokedByUserId: null,
      },
    }),
  ]);
}

export async function getReplayPlaybackAccess(
  replayAssetId: string,
  userId: string
): Promise<ReplayPlaybackAccessDto> {
  const accessAllowed = await canViewReplayAsset(userId, replayAssetId);
  if (!accessAllowed) {
    throw new Error("FORBIDDEN");
  }

  const [asset, user] = await Promise.all([
    db.replayAsset.findUniqueOrThrow({
      where: { id: replayAssetId },
      include: {
        entitlements: {
          where: {
            userId,
            revokedAt: null,
          },
          orderBy: { endsAt: "desc" },
          take: 1,
        },
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
  ]);

  assertSupportedReplayAsset(asset.resourceType);

  if (!user) {
    throw new Error("FORBIDDEN");
  }

  const isOwnerAdmin = isOwnerAdminRole(user.role);

  if (!isOwnerAdmin) {
    const entitlement = asset.entitlements[0] || null;
    if (!entitlement) {
      throw new Error("FORBIDDEN");
    }
    if (entitlement.endsAt <= now()) {
      throw new Error("REPLAY_EXPIRED");
    }
    await assertReplayEntitlementNotBlockedForDispute(userId, asset.id);
  }

  if (asset.status !== ReplayAssetStatus.ready || !asset.playbackUrl) {
    throw new Error("REPLAY_NOT_READY");
  }

  if (isOwnerAdmin) {
    await createAdminActionLog({
      actorUserId: userId,
      actionType: "replay_playback_opened",
      targetType: "replay_asset",
      targetId: asset.id,
      metadataJson: {
        status: asset.status,
      },
    });
  }

  return {
    replayAssetId: asset.id,
    playbackUrl: asset.playbackUrl,
    status: asset.status,
  };
}

export async function revokeReplayEntitlement(input: {
  replayAssetId: string;
  userId: string;
  actorUserId: string;
  accessType?: ReplayEntitlementAccessType;
  reason?: string | null;
}) {
  const asset = await db.replayAsset.findUniqueOrThrow({
    where: { id: input.replayAssetId },
    select: { resourceType: true },
  });
  assertSupportedReplayAsset(asset.resourceType);

  const entitlement = await db.replayEntitlement.findFirst({
    where: {
      replayAssetId: input.replayAssetId,
      userId: input.userId,
      accessType: input.accessType,
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
  if (!entitlement) {
    throw new Error("REPLAY_ENTITLEMENT_NOT_FOUND");
  }

  const updated = await db.replayEntitlement.update({
    where: { id: entitlement.id },
    data: {
      revokedAt: now(),
      revokedByUserId: input.actorUserId,
    },
  });

  await createAdminActionLog({
    actorUserId: input.actorUserId,
    actionType: "replay_entitlement_revoked",
    targetType: "replay_entitlement",
    targetId: updated.id,
    reason: input.reason || null,
    oldValueJson: {
      revokedAt: null,
    },
    newValueJson: {
      revokedAt: updated.revokedAt?.toISOString() || null,
    },
  });

  return updated;
}

export async function deleteReplayAssetNow(replayAssetId: string, actorUserId: string) {
  const asset = await db.replayAsset.findUniqueOrThrow({
    where: { id: replayAssetId },
  });
  assertSupportedReplayAsset(asset.resourceType);

  let nextStatus: ReplayAssetStatus = ReplayAssetStatus.deleted;
  let deletedAt = now();
  let syncError: string | null = null;

  try {
    if (asset.dailyRecordingId) {
      await deleteRecording(asset.dailyRecordingId);
    }
  } catch (error) {
    nextStatus = ReplayAssetStatus.delete_failed;
    deletedAt = asset.deletedAt || now();
    syncError = error instanceof Error ? error.message : "Delete failed";
  }

  const updated = await db.replayAsset.update({
    where: { id: replayAssetId },
    data: {
      status: nextStatus,
      deletedAt,
      syncError,
    },
  });

  await createAdminActionLog({
    actorUserId,
    actionType: "replay_deleted",
    targetType: "replay_asset",
    targetId: replayAssetId,
    metadataJson: {
      status: updated.status,
      dailyRecordingId: updated.dailyRecordingId,
    },
  });

  return updated;
}

export async function cleanupExpiredReplayAssets() {
  const assets = await db.replayAsset.findMany({
    where: {
      resourceType: { in: [...REPLAY_RESOURCE_TYPES] },
      deleteAfterAt: {
        lte: now(),
      },
      status: {
        in: [
          ReplayAssetStatus.ready,
          ReplayAssetStatus.processing,
          ReplayAssetStatus.sync_failed,
          ReplayAssetStatus.delete_failed,
        ],
      },
    },
    orderBy: { deleteAfterAt: "asc" },
  });

  let deleted = 0;
  let failed = 0;

  for (const asset of assets) {
    await db.replayAsset.update({
      where: { id: asset.id },
      data: {
        status: ReplayAssetStatus.delete_pending,
      },
    });

    try {
      if (asset.dailyRecordingId) {
        await deleteRecording(asset.dailyRecordingId);
      }

      await db.replayAsset.update({
        where: { id: asset.id },
        data: {
          status: ReplayAssetStatus.deleted,
          deletedAt: now(),
          syncError: null,
        },
      });
      deleted += 1;
    } catch (error) {
      await db.replayAsset.update({
        where: { id: asset.id },
        data: {
          status: ReplayAssetStatus.delete_failed,
          syncError: error instanceof Error ? error.message : "Delete failed",
        },
      });
      failed += 1;
    }
  }

  return {
    processed: assets.length,
    deleted,
    failed,
  };
}

export async function listReplayAssetsForUser(userId: string): Promise<ReplayAssetSummaryDto[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return [];
  }

  if (isOwnerAdminRole(user.role)) {
    const assets = await db.replayAsset.findMany({
      where: {
        resourceType: { in: [...REPLAY_RESOURCE_TYPES] },
      },
      include: replayAssetInclude,
      orderBy: [{ createdAt: "desc" }],
    });

    return assets.map((asset) =>
      toReplaySummaryDto({
        asset,
        accessType: "owner_admin",
      })
    );
  }

  const entitlements = await db.replayEntitlement.findMany({
    where: {
      userId,
      revokedAt: null,
      replayAsset: {
        resourceType: { in: [...REPLAY_RESOURCE_TYPES] },
      },
    },
    include: {
      replayAsset: {
        include: replayAssetInclude,
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return entitlements.map((entitlement) =>
    toReplaySummaryDto({
      asset: entitlement.replayAsset,
      accessType: entitlement.accessType,
      entitlementEndsAt: entitlement.endsAt,
    })
  );
}
