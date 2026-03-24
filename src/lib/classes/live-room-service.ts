import { ClassAttendanceEventType, ClassRoomSetupStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { type DailyParticipantPermissions, updateRoomPermissions } from "@/lib/daily/service";
import { getClassSessionRoomMode, resolveSessionCommunityMode } from "@/lib/classes/room-mode";

function getModeratorPermissions(): DailyParticipantPermissions {
  return {
    hasPresence: true,
    canSend: true,
    canReceive: {
      base: true,
    },
    canAdmin: ["participants"],
  };
}

function getMemberPermissions(params: {
  communityModeEnabled: boolean;
  moderatorUserIds: string[];
}): DailyParticipantPermissions {
  if (params.communityModeEnabled) {
    return {
      hasPresence: true,
      canSend: ["audio", "video"],
      canReceive: {
        base: true,
      },
      canAdmin: false,
    };
  }

  return {
    hasPresence: true,
    canSend: ["audio", "video"],
    canReceive: {
      base: ["audio"],
      byUserId: Object.fromEntries(params.moderatorUserIds.map((userId) => [userId, true])),
    },
    canAdmin: false,
  };
}

export function getEffectiveSessionCommunityMode(params: {
  typeSnapshot: string;
  capacity: number;
  communityModeEnabled: boolean;
  communityModeUpdatedAt: Date | null;
}) {
  return resolveSessionCommunityMode({
    classType: params.typeSnapshot,
    capacity: params.capacity,
    communityModeEnabled: params.communityModeEnabled,
    communityModeUpdatedAt: params.communityModeUpdatedAt,
  });
}

export function buildSessionParticipantPermissions(params: {
  typeSnapshot: string;
  capacity: number;
  communityModeEnabled: boolean;
  communityModeUpdatedAt: Date | null;
  isModerator: boolean;
  moderatorUserIds: string[];
}) {
  const roomMode = getClassSessionRoomMode({
    classType: params.typeSnapshot,
    capacity: params.capacity,
  });
  const effectiveCommunityMode = getEffectiveSessionCommunityMode(params);

  return {
    roomMode,
    effectiveCommunityMode,
    permissions: params.isModerator
      ? getModeratorPermissions()
      : getMemberPermissions({
          communityModeEnabled: effectiveCommunityMode,
          moderatorUserIds: params.moderatorUserIds,
        }),
  };
}

async function getActiveRoomParticipants(params: { sessionId: string; instructorUserId: string }) {
  const events = await db.classAttendanceEvent.findMany({
    where: {
      sessionId: params.sessionId,
      dailyParticipantId: {
        not: null,
      },
      type: {
        in: [ClassAttendanceEventType.joined, ClassAttendanceEventType.left],
      },
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    select: {
      dailyParticipantId: true,
      userId: true,
      type: true,
      occurredAt: true,
    },
  });

  const latestByParticipantId = new Map<
    string,
    {
      participantId: string;
      userId: string;
      type: ClassAttendanceEventType;
    }
  >();

  for (const event of events) {
    if (
      !event.dailyParticipantId ||
      !event.userId ||
      latestByParticipantId.has(event.dailyParticipantId)
    ) {
      continue;
    }

    latestByParticipantId.set(event.dailyParticipantId, {
      participantId: event.dailyParticipantId,
      userId: event.userId,
      type: event.type,
    });
  }

  const activeParticipants = Array.from(latestByParticipantId.values()).filter(
    (event) => event.type === ClassAttendanceEventType.joined
  );
  if (activeParticipants.length === 0) {
    return [];
  }

  const users = await db.user.findMany({
    where: {
      id: {
        in: activeParticipants.map((participant) => participant.userId),
      },
    },
    select: {
      id: true,
      role: true,
    },
  });
  const roleByUserId = new Map(users.map((user) => [user.id, user.role]));

  return activeParticipants.map((participant) => ({
    participantId: participant.participantId,
    userId: participant.userId,
    isModerator:
      participant.userId === params.instructorUserId ||
      roleByUserId.get(participant.userId) === "admin",
  }));
}

export async function syncSessionCommunityMode(sessionId: string) {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      typeSnapshot: true,
      capacity: true,
      instructorUserId: true,
      communityModeEnabled: true,
      communityModeUpdatedAt: true,
      dailyRoomName: true,
      roomSetupStatus: true,
    },
  });

  if (!session) {
    throw new Error("SESSION_NOT_FOUND");
  }
  if (!session.dailyRoomName || session.roomSetupStatus !== ClassRoomSetupStatus.ready) {
    return { status: "skipped" as const };
  }

  const activeParticipants = await getActiveRoomParticipants({
    sessionId,
    instructorUserId: session.instructorUserId,
  });
  if (activeParticipants.length === 0) {
    return { status: "skipped" as const };
  }

  const moderatorUserIds = Array.from(
    new Set([
      session.instructorUserId,
      ...activeParticipants
        .filter((participant) => participant.isModerator)
        .map((participant) => participant.userId),
    ])
  );
  const memberPermissions = buildSessionParticipantPermissions({
    ...session,
    isModerator: false,
    moderatorUserIds,
  }).permissions;

  const data: Record<string, DailyParticipantPermissions> = {
    "*": memberPermissions,
  };

  for (const participant of activeParticipants.filter((item) => item.isModerator)) {
    data[participant.participantId] = getModeratorPermissions();
  }

  await updateRoomPermissions({
    roomName: session.dailyRoomName,
    data,
  });

  return { status: "synced" as const };
}

export async function updateSessionCommunityMode(params: { sessionId: string; enabled: boolean }) {
  const session = await db.classSession.update({
    where: { id: params.sessionId },
    data: {
      communityModeEnabled: params.enabled,
      communityModeUpdatedAt: new Date(),
    },
  });

  try {
    const result = await syncSessionCommunityMode(params.sessionId);
    return {
      session,
      dailySyncStatus: result.status,
    };
  } catch (error) {
    return {
      session,
      dailySyncStatus: "failed" as const,
      dailySyncError:
        error instanceof Error ? error.message : "Failed to sync community mode with Daily",
    };
  }
}
