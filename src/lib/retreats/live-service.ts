import "server-only";

import {
  ReplayAssetStatus,
  RetreatLiveChatMessageType,
  RetreatLiveDisplayMode,
  RetreatLiveRoomState,
} from "@prisma/client";
import { canManageRetreatDate } from "@/lib/authz/access";
import { isStaffAdminRole } from "@/lib/authz/roles";
import { db } from "@/lib/db";
import { type DailyParticipantPermissions, updateRoomPermissions } from "@/lib/daily/service";
import {
  getPhysicalServiceAcceptanceRequirements,
  getAcceptanceRequirementStates,
  assertCurrentAcceptances,
} from "@/lib/legal/acceptance-service";
import { setUpRetreatOnlineRoom } from "@/lib/retreats/service";
import { getWorkshopSetupState } from "@/lib/retreats/workshop-setup";

const CHAT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const CHAT_RATE_WINDOW_MS = 10_000;
const CHAT_RATE_LIMIT = 5;
const PAYMENT_STATUSES_WITH_ACCESS = ["deposit_paid", "partially_paid", "paid_in_full"];
const BOOKING_STATUSES_WITH_ACCESS = ["deposit_paid", "balance_due", "paid_in_full"];

export async function updateRetreatLiveRecordingState(
  retreatDateId: string,
  state: "recording" | "stopped" | "failed"
) {
  return db.retreatDate.update({
    where: { id: retreatDateId },
    data: { liveRecordingState: state },
  });
}

export function buildRetreatParticipantPermissions(input: {
  mode: RetreatLiveDisplayMode;
  focusedPresenterUserId: string | null;
}): DailyParticipantPermissions {
  return {
    hasPresence: true,
    canSend: ["video", "audio"],
    canReceive:
      input.mode === RetreatLiveDisplayMode.gallery
        ? { base: true }
        : {
            base: ["audio"],
            byUserId: input.focusedPresenterUserId
              ? { [input.focusedPresenterUserId]: true }
              : undefined,
          },
    canAdmin: false,
  };
}

function displayName(user: {
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string | null;
}) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.name ||
    user.email ||
    "Retreat guest"
  );
}

function serializeMessage(message: {
  id: string;
  senderUserId: string;
  type: RetreatLiveChatMessageType;
  text: string;
  createdAt: Date;
  sender: {
    firstName: string | null;
    lastName: string | null;
    name: string | null;
    email: string | null;
  };
}) {
  return {
    id: message.id,
    userId: message.senderUserId,
    sender: displayName(message.sender),
    type: message.type,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  };
}

function normalizeChatText(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
}

async function getBookingAccess(bookingId: string, userId: string) {
  const booking = await db.retreatBooking.findFirst({
    where: {
      id: bookingId,
      OR: [
        { attendeeUserId: userId },
        {
          attendeeUserId: null,
          purchaserUserId: userId,
          giftPurchaseId: null,
        },
      ],
    },
    include: {
      retreatDate: true,
      onlineAccessEntitlements: {
        where: { userId },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });
  if (!booking) throw new Error("NOT_FOUND");
  if (booking.retreatDate.retreatType !== "online") throw new Error("NOT_ONLINE_RETREAT");
  if (
    !PAYMENT_STATUSES_WITH_ACCESS.includes(booking.paymentStatus) ||
    !BOOKING_STATUSES_WITH_ACCESS.includes(booking.bookingStatus)
  ) {
    throw new Error("PAYMENT_REQUIRED");
  }
  const entitlement = booking.onlineAccessEntitlements[0] || null;
  if (booking.retreatDate.status !== "cancelled" && !entitlement?.liveAccessEnabled) {
    throw new Error("FORBIDDEN");
  }
  return { booking, entitlement };
}

async function getHostAccess(retreatDateId: string, userId: string, provisionRoom = false) {
  if (!(await canManageRetreatDate(userId, retreatDateId))) throw new Error("FORBIDDEN");
  let retreatDate = await db.retreatDate.findUnique({ where: { id: retreatDateId } });
  if (!retreatDate) throw new Error("NOT_FOUND");
  if (retreatDate.retreatType !== "online") throw new Error("NOT_ONLINE_RETREAT");
  if (provisionRoom && (!retreatDate.dailyRoomName || !retreatDate.dailyRoomUrl)) {
    retreatDate = await setUpRetreatOnlineRoom(retreatDateId);
  }
  return retreatDate;
}

export async function getRetreatLiveLandingState(bookingId: string, userId: string) {
  const { booking, entitlement } = await getBookingAccess(bookingId, userId);
  const now = new Date();
  const [acceptanceStates, workshopSetup] = await Promise.all([
    getAcceptanceRequirementStates(
      userId,
      getPhysicalServiceAcceptanceRequirements("retreat_live_join")
    ),
    getWorkshopSetupState(userId),
  ]);
  const registrationIncomplete = !workshopSetup.complete;
  const replayAsset = await db.replayAsset.findFirst({
    where: {
      retreatDateId: booking.retreatDateId,
      resourceType: "retreat_date",
      status: ReplayAssetStatus.ready,
      entitlements: {
        some: {
          userId,
          revokedAt: null,
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
      },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  let state:
    | "registration_incomplete"
    | "cancelled"
    | "scheduled"
    | "waiting_room"
    | "pre_join"
    | "live"
    | "ended"
    | "replay_available" = "scheduled";
  if (booking.retreatDate.status === "cancelled") state = "cancelled";
  else if (registrationIncomplete) state = "registration_incomplete";
  else if (booking.retreatDate.liveRoomState === RetreatLiveRoomState.ended) {
    state = replayAsset ? "replay_available" : "ended";
  } else if (entitlement?.liveAccessStartsAt && now < entitlement.liveAccessStartsAt) {
    state = "scheduled";
  } else if (booking.retreatDate.liveRoomState === RetreatLiveRoomState.started) {
    state = "live";
  } else if (booking.retreatDate.liveRoomState === RetreatLiveRoomState.prepared) {
    state = "pre_join";
  } else {
    state = "waiting_room";
  }

  return {
    bookingId: booking.id,
    retreatDateId: booking.retreatDateId,
    title: booking.retreatDate.retreatTitleSnapshot,
    startsAt: booking.retreatDate.startsAt.toISOString(),
    endsAt: booking.retreatDate.endsAt.toISOString(),
    timezone: booking.retreatDate.timezone,
    capacity: booking.retreatDate.capacity,
    state,
    roomState: booking.retreatDate.liveRoomState,
    displayMode: booking.retreatDate.liveDisplayMode,
    displayVersion: booking.retreatDate.liveDisplayVersion,
    focusedPresenterUserId: booking.retreatDate.focusedPresenterUserId,
    chatEnabled: booking.retreatDate.chatEnabled && !booking.retreatDate.liveChatDisabledAt,
    isRecorded: booking.retreatDate.isRecorded,
    recordingNotice: booking.retreatDate.isRecorded
      ? "This retreat may be recorded. Participant audio, video or chat may be captured when used."
      : null,
    retentionNotice: booking.retreatDate.isRecorded
      ? "Published replay access expires on the date shown in your dashboard."
      : null,
    defaultMicMuted: booking.retreatDate.participantMicDefaultMuted,
    defaultCameraOff: booking.retreatDate.participantCameraDefaultOff,
    registrationIncomplete,
    setupMissing: workshopSetup.missing,
    requiredAcceptances: acceptanceStates.filter((acceptance) => !acceptance.isCurrent),
    replayAssetId: replayAsset?.id || null,
  };
}

export async function getRetreatParticipantTokenContext(bookingId: string, userId: string) {
  const { booking, entitlement } = await getBookingAccess(bookingId, userId);
  if (booking.retreatDate.status === "cancelled" || !entitlement?.liveAccessEnabled) {
    throw new Error("ROOM_CLOSED");
  }
  const workshopSetup = await getWorkshopSetupState(userId);
  if (!workshopSetup.complete) throw new Error("REGISTRATION_INCOMPLETE");
  await assertCurrentAcceptances(
    userId,
    getPhysicalServiceAcceptanceRequirements("retreat_live_join")
  );
  const now = new Date();
  if (entitlement.liveAccessStartsAt && now < entitlement.liveAccessStartsAt) {
    throw new Error("EARLY_JOIN_WINDOW");
  }
  if (entitlement.liveAccessEndsAt && now > entitlement.liveAccessEndsAt) {
    throw new Error("ROOM_CLOSED");
  }
  if (booking.retreatDate.liveRoomState === RetreatLiveRoomState.ended) {
    throw new Error("ROOM_CLOSED");
  }
  if (
    booking.retreatDate.liveRoomState === RetreatLiveRoomState.unprepared ||
    !booking.retreatDate.dailyRoomName ||
    !booking.retreatDate.dailyRoomUrl
  ) {
    throw new Error("ROOM_NOT_READY");
  }
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { firstName: true, lastName: true, name: true, email: true },
  });
  return {
    bookingId: booking.id,
    retreatDateId: booking.retreatDateId,
    roomName: booking.retreatDate.dailyRoomName,
    roomUrl: booking.retreatDate.dailyRoomUrl,
    userName: displayName(user),
    expiresAt: entitlement.liveAccessEndsAt || booking.retreatDate.endsAt,
    participantRole: "attendee" as const,
    roomState: booking.retreatDate.liveRoomState,
    displayMode: booking.retreatDate.liveDisplayMode,
    displayVersion: booking.retreatDate.liveDisplayVersion,
    focusedPresenterUserId: booking.retreatDate.focusedPresenterUserId,
    chatEnabled: booking.retreatDate.chatEnabled && !booking.retreatDate.liveChatDisabledAt,
    canRecord: false,
    canModerate: false,
    canPublishReplay: false,
    defaultMicMuted: booking.retreatDate.participantMicDefaultMuted,
    defaultCameraOff: booking.retreatDate.participantCameraDefaultOff,
    isRecorded: booking.retreatDate.isRecorded,
  };
}

export async function getRetreatHostTokenContext(retreatDateId: string, userId: string) {
  const retreatDate = await getHostAccess(retreatDateId, userId, true);
  if (!retreatDate.dailyRoomName || !retreatDate.dailyRoomUrl) throw new Error("ROOM_NOT_READY");
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { firstName: true, lastName: true, name: true, email: true, role: true },
  });
  return {
    retreatDateId,
    roomName: retreatDate.dailyRoomName,
    roomUrl: retreatDate.dailyRoomUrl,
    userName: displayName(user),
    expiresAt: new Date(retreatDate.endsAt.getTime() + 2 * 60 * 60 * 1000),
    participantRole: "host" as const,
    roomState: retreatDate.liveRoomState,
    displayMode: retreatDate.liveDisplayMode,
    displayVersion: retreatDate.liveDisplayVersion,
    focusedPresenterUserId: retreatDate.focusedPresenterUserId,
    chatEnabled: retreatDate.chatEnabled && !retreatDate.liveChatDisabledAt,
    canRecord: retreatDate.isRecorded,
    canModerate: true,
    canPublishReplay: isStaffAdminRole(user.role),
    defaultMicMuted: false,
    defaultCameraOff: false,
    isRecorded: retreatDate.isRecorded,
    recordingState: retreatDate.liveRecordingState,
  };
}

export async function getRetreatHostPageState(retreatDateId: string, userId: string) {
  const retreatDate = await getHostAccess(retreatDateId, userId);
  const [registeredCount, replayAsset] = await Promise.all([
    db.retreatBooking.aggregate({
      where: {
        retreatDateId,
        bookingStatus: { in: ["deposit_paid", "balance_due", "paid_in_full"] },
      },
      _sum: { attendeeCount: true },
    }),
    db.replayAsset.findFirst({
      where: { retreatDateId, resourceType: "retreat_date" },
      select: { id: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    retreatDateId,
    title: retreatDate.retreatTitleSnapshot,
    startsAt: retreatDate.startsAt.toISOString(),
    endsAt: retreatDate.endsAt.toISOString(),
    timezone: retreatDate.timezone,
    capacity: retreatDate.capacity,
    registeredCount: registeredCount._sum.attendeeCount || 0,
    roomState: retreatDate.liveRoomState,
    displayMode: retreatDate.liveDisplayMode,
    displayVersion: retreatDate.liveDisplayVersion,
    focusedPresenterUserId: retreatDate.focusedPresenterUserId,
    chatEnabled: retreatDate.chatEnabled && !retreatDate.liveChatDisabledAt,
    isRecorded: retreatDate.isRecorded,
    recordingState: retreatDate.liveRecordingState,
    replayAsset,
  };
}

export async function updateRetreatLiveLifecycle(input: {
  retreatDateId: string;
  userId: string;
  action: "start" | "end" | "enable_chat" | "disable_chat";
}) {
  const retreatDate = await getHostAccess(
    input.retreatDateId,
    input.userId,
    input.action === "start"
  );
  const now = new Date();
  if (input.action === "start") {
    if (retreatDate.liveRoomState === RetreatLiveRoomState.ended) throw new Error("ROOM_CLOSED");
    return db.retreatDate.update({
      where: { id: retreatDate.id },
      data: {
        liveRoomState: RetreatLiveRoomState.started,
        liveStartedAt: retreatDate.liveStartedAt || now,
      },
    });
  }
  if (input.action === "end") {
    return db.retreatDate.update({
      where: { id: retreatDate.id },
      data: {
        liveRoomState: RetreatLiveRoomState.ended,
        liveEndedAt: retreatDate.liveEndedAt || now,
        liveChatDisabledAt: retreatDate.liveChatDisabledAt || now,
      },
    });
  }
  return db.retreatDate.update({
    where: { id: retreatDate.id },
    data: { liveChatDisabledAt: input.action === "disable_chat" ? now : null },
  });
}

export async function updateRetreatDisplayMode(input: {
  retreatDateId: string;
  userId: string;
  mode: RetreatLiveDisplayMode;
  focusedPresenterUserId?: string | null;
}) {
  const existing = await getHostAccess(input.retreatDateId, input.userId);
  const focusedPresenterUserId =
    input.mode === RetreatLiveDisplayMode.presenter
      ? input.focusedPresenterUserId || input.userId
      : null;
  const retreatDate = await db.retreatDate.update({
    where: { id: input.retreatDateId },
    data: {
      liveDisplayMode: input.mode,
      focusedPresenterUserId,
      liveDisplayVersion: { increment: 1 },
    },
  });

  if (!existing.dailyRoomName) {
    return { retreatDate, dailySyncStatus: "skipped" as const };
  }

  try {
    const activeAttendances = await db.retreatLiveAttendance.findMany({
      where: { retreatDateId: input.retreatDateId, leftAt: null },
      select: { dailySessionId: true },
    });
    const participantIds = Array.from(
      new Set(activeAttendances.map((attendance) => attendance.dailySessionId))
    );
    if (participantIds.length === 0) {
      return { retreatDate, dailySyncStatus: "skipped" as const };
    }

    const permissions = buildRetreatParticipantPermissions({
      mode: input.mode,
      focusedPresenterUserId,
    });
    await updateRoomPermissions({
      roomName: existing.dailyRoomName,
      data: Object.fromEntries(participantIds.map((participantId) => [participantId, permissions])),
    });
    return { retreatDate, dailySyncStatus: "synced" as const };
  } catch (error) {
    return {
      retreatDate,
      dailySyncStatus: "failed" as const,
      dailySyncError:
        error instanceof Error ? error.message : "Failed to sync display mode with Daily",
    };
  }
}

async function assertChatAccess(retreatDateId: string, userId: string) {
  const host = await canManageRetreatDate(userId, retreatDateId);
  const entitlement = host
    ? null
    : await db.retreatOnlineAccessEntitlement.findFirst({
        where: { retreatDateId, userId, liveAccessEnabled: true },
        select: { bookingId: true },
      });
  if (!host && !entitlement) throw new Error("FORBIDDEN");
  const retreatDate = await db.retreatDate.findUnique({ where: { id: retreatDateId } });
  if (!retreatDate) throw new Error("NOT_FOUND");
  return { host, entitlement, retreatDate };
}

export async function listRetreatChatMessages(retreatDateId: string, userId: string) {
  const { host, retreatDate } = await assertChatAccess(retreatDateId, userId);
  if (!host && retreatDate.liveRoomState === RetreatLiveRoomState.ended) return [];
  const messages = await db.retreatLiveChatMessage.findMany({
    where: {
      retreatDateId,
      deletedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      sender: { select: { firstName: true, lastName: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 250,
  });
  return messages.map(serializeMessage);
}

export async function createRetreatChatMessage(input: {
  retreatDateId: string;
  userId: string;
  text: string;
  type?: RetreatLiveChatMessageType;
}) {
  const { host, retreatDate } = await assertChatAccess(input.retreatDateId, input.userId);
  if (retreatDate.liveRoomState === RetreatLiveRoomState.ended) throw new Error("ROOM_CLOSED");
  if (!retreatDate.chatEnabled || retreatDate.liveChatDisabledAt) throw new Error("CHAT_DISABLED");
  const type = input.type || RetreatLiveChatMessageType.message;
  if (type === RetreatLiveChatMessageType.announcement && !host) throw new Error("FORBIDDEN");
  const text = normalizeChatText(input.text);
  if (!text) throw new Error("INVALID_MESSAGE");

  const recentCount = await db.retreatLiveChatMessage.count({
    where: {
      retreatDateId: input.retreatDateId,
      senderUserId: input.userId,
      createdAt: { gte: new Date(Date.now() - CHAT_RATE_WINDOW_MS) },
    },
  });
  if (recentCount >= CHAT_RATE_LIMIT) throw new Error("RATE_LIMITED");

  const message = await db.retreatLiveChatMessage.create({
    data: {
      retreatDateId: input.retreatDateId,
      senderUserId: input.userId,
      type,
      text,
      expiresAt: new Date(Date.now() + CHAT_RETENTION_MS),
    },
    include: {
      sender: { select: { firstName: true, lastName: true, name: true, email: true } },
    },
  });
  return serializeMessage(message);
}

export async function deleteRetreatChatMessage(input: {
  retreatDateId: string;
  messageId: string;
  userId: string;
}) {
  await getHostAccess(input.retreatDateId, input.userId);
  const result = await db.retreatLiveChatMessage.updateMany({
    where: { id: input.messageId, retreatDateId: input.retreatDateId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (!result.count) throw new Error("NOT_FOUND");
  return { deleted: true };
}

export async function recordRetreatAttendanceEvent(input: {
  retreatDateId?: string;
  roomName?: string;
  userId: string;
  dailySessionId: string;
  type: "joined" | "left";
  occurredAt?: Date;
  bookingId?: string;
}) {
  const occurredAt = input.occurredAt || new Date();
  const retreatDate = input.retreatDateId
    ? await db.retreatDate.findUnique({ where: { id: input.retreatDateId }, select: { id: true } })
    : await db.retreatDate.findFirst({
        where: { dailyRoomName: input.roomName },
        select: { id: true },
      });
  if (!retreatDate) throw new Error("NOT_FOUND");
  const booking = await db.retreatBooking.findFirst({
    where: {
      id: input.bookingId,
      retreatDateId: retreatDate.id,
      OR: [{ attendeeUserId: input.userId }, { purchaserUserId: input.userId }],
    },
    select: { id: true },
  });
  const resolvedBooking =
    booking ||
    (await db.retreatBooking.findFirst({
      where: {
        retreatDateId: retreatDate.id,
        OR: [{ attendeeUserId: input.userId }, { purchaserUserId: input.userId }],
        bookingStatus: { in: ["deposit_paid", "balance_due", "paid_in_full"] },
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }));
  if (!resolvedBooking) throw new Error("FORBIDDEN");

  const key = {
    retreatDateId_userId_bookingId_dailySessionId: {
      retreatDateId: retreatDate.id,
      userId: input.userId,
      bookingId: resolvedBooking.id,
      dailySessionId: input.dailySessionId,
    },
  };
  if (input.type === "joined") {
    return db.retreatLiveAttendance.upsert({
      where: key,
      create: {
        retreatDateId: retreatDate.id,
        userId: input.userId,
        bookingId: resolvedBooking.id,
        dailySessionId: input.dailySessionId,
        joinedAt: occurredAt,
        lastEventAt: occurredAt,
      },
      update: {
        joinedAt: occurredAt,
        leftAt: null,
        durationSeconds: 0,
        lastEventAt: occurredAt,
      },
    });
  }
  const existing = await db.retreatLiveAttendance.findUnique({ where: key });
  if (!existing) {
    return db.retreatLiveAttendance.create({
      data: {
        retreatDateId: retreatDate.id,
        userId: input.userId,
        bookingId: resolvedBooking.id,
        dailySessionId: input.dailySessionId,
        joinedAt: occurredAt,
        leftAt: occurredAt,
        durationSeconds: 0,
        lastEventAt: occurredAt,
      },
    });
  }
  const leftAt = occurredAt > existing.joinedAt ? occurredAt : existing.joinedAt;
  return db.retreatLiveAttendance.update({
    where: { id: existing.id },
    data: {
      leftAt,
      durationSeconds: Math.max(
        0,
        Math.floor((leftAt.getTime() - existing.joinedAt.getTime()) / 1000)
      ),
      lastEventAt: occurredAt,
    },
  });
}

export async function getRetreatLiveRoster(retreatDateId: string, userId: string) {
  await getHostAccess(retreatDateId, userId);
  const records = await db.retreatLiveAttendance.findMany({
    where: { retreatDateId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, name: true, email: true } },
      booking: { select: { id: true } },
    },
    orderBy: { joinedAt: "asc" },
  });
  return records.map((record) => ({
    id: record.id,
    userId: record.userId,
    bookingId: record.bookingId,
    name: displayName(record.user),
    joinedAt: record.joinedAt.toISOString(),
    leftAt: record.leftAt?.toISOString() || null,
    durationSeconds: record.durationSeconds,
    isPresent: !record.leftAt,
  }));
}

export async function purgeExpiredRetreatChat() {
  const result = await db.retreatLiveChatMessage.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return { deleted: result.count };
}
