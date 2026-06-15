import {
  ClassBookingStatus,
  ClassRoomSetupStatus,
  ClassSessionStatus,
  ClassWaitlistStatus,
  Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import {
  getClassDefinitionBySlug,
  getClassDefinitions,
  getInstructorProfilesByIds,
} from "@/lib/content";
import { finalizeSessionNoShows } from "@/lib/classes/attendance-service";
import {
  getClassSessionRoomMode,
  getDefaultCommunityModeForRoomMode,
  resolveSessionCommunityMode,
} from "@/lib/classes/room-mode";
import {
  getClassOperationalSettings,
  getJoinWindowOpensAt,
  getLateJoinCutoffAt,
  type ClassOperationalSettingsDto,
} from "@/lib/classes/settings-service";
import { createSessionRoom, deleteSessionRoom, isDailyConfigured } from "@/lib/daily/service";
import { HEALTH_CATEGORIES } from "@/data/health-profile-data";
import { getHealthCheckInMode } from "@/lib/health/health-service";
import { resolveClassInstructorSnapshot } from "@/lib/instructors/effective-instructor-service";
import { resolveReplayPolicyForClassSession } from "@/lib/replay/policy-service";
import type {
  AdminClassSessionDto,
  BulkCreateSessionsInput,
  ClassSessionDetailDto,
  ClassSessionListItemDto,
  ScheduleClassItemDto,
  ScheduleDayDto,
} from "@/lib/classes/types";

const CONDITION_LABELS = new Map(
  HEALTH_CATEGORIES.flatMap((category) => category.items.map((item) => [item.key, item.label]))
);
const PUBLIC_SCHEDULE_HORIZON_DAYS = 28;

async function logClassSessionAction(input: {
  actorUserId?: string | null;
  actionType: string;
  targetId?: string | null;
  reason?: string | null;
  oldValueJson?: Prisma.InputJsonValue;
  newValueJson?: Prisma.InputJsonValue;
  metadataJson?: Prisma.InputJsonValue;
}) {
  if (!input.actorUserId) {
    return;
  }

  await createAdminActionLog({
    actorUserId: input.actorUserId,
    actionType: input.actionType,
    targetType: "class_session",
    targetId: input.targetId,
    reason: input.reason,
    oldValueJson: input.oldValueJson,
    newValueJson: input.newValueJson,
    metadataJson: input.metadataJson,
  });
}

function formatDateInTimezone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    throw new Error("INVALID_TIMEZONE_DATE");
  }
  return `${year}-${month}-${day}`;
}

function toDateOnlyUtcForTimezone(date: Date, timezone: string) {
  return new Date(`${formatDateInTimezone(date, timezone)}T00:00:00.000Z`);
}

function shiftDate(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toHealthConditionLabel(conditionKey: string, detail: string | null) {
  if (detail && detail.trim().length > 0) {
    return detail.split("—")[0].split("–")[0].trim();
  }
  return CONDITION_LABELS.get(conditionKey) ?? conditionKey.replaceAll("_", " ");
}

function parseOffsetToMinutes(offsetToken: string): number {
  if (offsetToken === "GMT" || offsetToken === "UTC") return 0;
  const match =
    offsetToken.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/) ||
    offsetToken.match(/UTC([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  return sign * (hours * 60 + minutes);
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(date);
  const token = parts.find((p) => p.type === "timeZoneName")?.value || "GMT";
  return parseOffsetToMinutes(token);
}

export function toUtcFromLocalDateTime(
  localDate: string,
  localTime: string,
  timeZone: string
): Date {
  const [year, month, day] = localDate.split("-").map(Number);
  const [hour, minute] = localTime.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offsetMinutes * 60_000);
}

function getBookedCount(session: { bookings: Array<{ status: ClassBookingStatus }> }) {
  return session.bookings.filter((b) => b.status === ClassBookingStatus.booked).length;
}

function getWaitlistCount(session: { waitlist: Array<{ status: ClassWaitlistStatus }> }) {
  return session.waitlist.filter((w) => w.status === ClassWaitlistStatus.waiting).length;
}

function clampPublicScheduleEnd(
  from: Date | undefined,
  to: Date | undefined,
  currentUserId?: string
) {
  if (currentUserId) return to;
  const start = from || new Date();
  const maxEnd = new Date(start.getTime() + PUBLIC_SCHEDULE_HORIZON_DAYS * 86400000);
  if (!to || to > maxEnd) {
    return maxEnd;
  }
  return to;
}

function toSessionListItem(
  session: Prisma.ClassSessionGetPayload<{
    include: {
      bookings: { select: { userId: true; status: true; firstJoinedAt: true } };
      waitlist: { select: { userId: true; status: true; position: true } };
    };
  }>,
  currentUserId?: string,
  instructorProfile?: { name?: string; bio?: string; avatarImageUrl?: string },
  settings?: ClassOperationalSettingsDto,
  currentUserCheckInMode?: "energy_only" | "energy_and_flare"
): ClassSessionListItemDto {
  const bookedCount = getBookedCount(session);
  const waitlistCount = getWaitlistCount(session);
  const myBooking = currentUserId
    ? session.bookings.find(
        (b) => b.userId === currentUserId && b.status !== ClassBookingStatus.cancelled
      )
    : null;
  const myWaitlist = currentUserId
    ? session.waitlist.find(
        (w) => w.userId === currentUserId && w.status === ClassWaitlistStatus.waiting
      )
    : null;

  const operationalSettings = settings || {
    preJoinWindowMinutes: 10,
    lateJoinCutoffMinutes: 5,
    creditRefundWindowMinutes: 180,
    emptyClassAutoCancelWindowMinutes: 180,
  };

  return {
    id: session.id,
    classDefinitionSlug: session.classDefinitionSlug,
    title: session.titleSnapshot,
    type: session.typeSnapshot,
    level: session.levelSnapshot,
    localDate: session.localDate?.toISOString().slice(0, 10) || null,
    startsAtUtc: session.startsAtUtc.toISOString(),
    endsAtUtc: session.endsAtUtc.toISOString(),
    timezone: session.timezone,
    durationMinutes: session.durationMinutes,
    capacity: session.capacity,
    status: session.status,
    instructorProfileEntryId: session.instructorProfileEntryId || null,
    instructorName: session.instructorNameSnapshot || instructorProfile?.name || null,
    instructorBio: session.instructorBioSnapshot || instructorProfile?.bio || null,
    instructorAvatarUrl: instructorProfile?.avatarImageUrl || null,
    spotsRemaining: Math.max(0, session.capacity - bookedCount),
    bookedCount,
    waitlistCount,
    dailyRoomUrl: session.dailyRoomUrl,
    roomSetupStatus: session.roomSetupStatus,
    roomSetupError: session.roomSetupError || null,
    communityModeEnabled: resolveSessionCommunityMode({
      classType: session.typeSnapshot,
      capacity: session.capacity,
      communityModeEnabled: session.communityModeEnabled,
      communityModeUpdatedAt: session.communityModeUpdatedAt,
    }),
    isRecorded: session.isRecorded,
    recordingScope: session.recordingScope,
    replayAvailable: session.replayAvailable,
    replayAccessDurationDays: session.replayAccessDurationDays,
    chatEnabled: session.chatEnabled,
    participantMicDefaultMuted: session.participantMicDefaultMuted,
    participantCameraDefaultOff: session.participantCameraDefaultOff,
    threeHourOutcome: session.autoCancelledForNoAttendanceAt
      ? "cancelled_no_attendance"
      : session.reminderProcessedAt
        ? "reminded"
        : "pending",
    joinWindowOpensAt: getJoinWindowOpensAt(session.startsAtUtc, operationalSettings).toISOString(),
    preJoinWindowMinutes: operationalSettings.preJoinWindowMinutes,
    lateJoinCutoffMinutes: operationalSettings.lateJoinCutoffMinutes,
    lateJoinCutoffAt: getLateJoinCutoffAt(session.startsAtUtc, operationalSettings).toISOString(),
    emptyClassAutoCancelWindowMinutes: operationalSettings.emptyClassAutoCancelWindowMinutes,
    isBookedByCurrentUser: Boolean(myBooking && myBooking.status === ClassBookingStatus.booked),
    myBookingStatus: myBooking?.status ?? null,
    hasPreviouslyJoinedCurrentUser: Boolean(myBooking?.firstJoinedAt),
    waitlistPosition: myWaitlist?.position ?? null,
    currentUserCheckInMode,
  };
}

export async function listClassSessions(params: {
  currentUserId?: string;
  from?: Date;
  to?: Date;
  type?: string;
  slug?: string;
  statusIn?: ClassSessionStatus[];
}) {
  const clampedTo = clampPublicScheduleEnd(params.from, params.to, params.currentUserId);
  const settings = await getClassOperationalSettings();
  const sessions = await db.classSession.findMany({
    where: {
      startsAtUtc: {
        gte: params.from,
        lte: clampedTo,
      },
      classDefinitionSlug: params.slug,
      typeSnapshot: params.type,
      status: params.statusIn ? { in: params.statusIn } : undefined,
    },
    include: {
      bookings: {
        select: {
          userId: true,
          status: true,
          firstJoinedAt: true,
        },
      },
      waitlist: {
        select: {
          userId: true,
          status: true,
          position: true,
        },
      },
    },
    orderBy: {
      startsAtUtc: "asc",
    },
  });

  const profileIds = Array.from(
    new Set(
      sessions
        .map((session) => session.instructorProfileEntryId)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );
  const profiles = await getInstructorProfilesByIds(profileIds);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const currentUserHealthProfile = params.currentUserId
    ? await db.healthProfile.findUnique({
        where: { userId: params.currentUserId },
        select: {
          declarationStatus: true,
          tracksFlareCheckIns: true,
        },
      })
    : null;
  const currentUserCheckInMode = getHealthCheckInMode({
    declarationStatus: currentUserHealthProfile?.declarationStatus ?? "incomplete",
    tracksFlareCheckIns: currentUserHealthProfile?.tracksFlareCheckIns ?? false,
  });

  return sessions.map((session) =>
    toSessionListItem(
      session,
      params.currentUserId,
      session.instructorProfileEntryId
        ? profileById.get(session.instructorProfileEntryId)
        : undefined,
      settings,
      currentUserCheckInMode
    )
  );
}

export type ClassSessionDetailScope = "public" | "member" | "assigned_instructor" | "owner_admin";

function toAssignedInstructorHealthSummary(healthSelectionCount: number) {
  return healthSelectionCount > 0 ? ["Relevant movement considerations shared"] : [];
}

export async function getClassSessionDetailForScope(
  sessionId: string,
  currentUserId: string | undefined,
  scope: ClassSessionDetailScope
): Promise<ClassSessionDetailDto | null> {
  const settings = await getClassOperationalSettings();
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    include: {
      bookings: {
        select: {
          userId: true,
          status: true,
          firstJoinedAt: true,
        },
        orderBy: { bookedAt: "asc" },
      },
      waitlist: {
        select: {
          userId: true,
          status: true,
          position: true,
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!session) return null;

  const profile = session.instructorProfileEntryId
    ? (await getInstructorProfilesByIds([session.instructorProfileEntryId]))[0]
    : undefined;
  const currentUserHealthProfile = currentUserId
    ? await db.healthProfile.findUnique({
        where: { userId: currentUserId },
        select: {
          declarationStatus: true,
          tracksFlareCheckIns: true,
        },
      })
    : null;
  const currentUserCheckInMode = getHealthCheckInMode({
    declarationStatus: currentUserHealthProfile?.declarationStatus ?? "incomplete",
    tracksFlareCheckIns: currentUserHealthProfile?.tracksFlareCheckIns ?? false,
  });

  const base = toSessionListItem(session, currentUserId, profile, settings, currentUserCheckInMode);

  if (scope === "public" || scope === "member") {
    return {
      ...base,
      notes: "",
      cancelReason: session.cancelReason,
      instructorUserId: "",
      bookings: [],
      waitlist: [],
    };
  }

  const detailedSession = await db.classSession.findUnique({
    where: { id: sessionId },
    include: {
      bookings: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: scope === "owner_admin",
              healthProfile: {
                select: {
                  selections: {
                    select: {
                      conditionKey: true,
                      detail: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { bookedAt: "asc" },
      },
      waitlist: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: scope === "owner_admin",
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!detailedSession) return null;

  const bookingUserIds = Array.from(
    new Set(detailedSession.bookings.map((booking) => booking.userId))
  );
  const attendanceCounts =
    scope === "owner_admin" && bookingUserIds.length
      ? await db.classBooking.groupBy({
          by: ["userId"],
          where: {
            userId: { in: bookingUserIds },
            status: ClassBookingStatus.attended,
          },
          _count: {
            _all: true,
          },
        })
      : [];
  const attendanceByUserId = new Map(
    attendanceCounts.map((row) => [row.userId, row._count._all || 0])
  );

  return {
    ...base,
    notes: detailedSession.notes || "",
    cancelReason: detailedSession.cancelReason,
    instructorUserId: detailedSession.instructorUserId,
    bookings: detailedSession.bookings.map((booking) => ({
      id: booking.id,
      userId: booking.userId,
      firstName: booking.user.firstName || "",
      lastName: booking.user.lastName || "",
      email: scope === "owner_admin" ? booking.user.email || "" : "",
      status: booking.status,
      bookedAt: booking.bookedAt.toISOString(),
      firstJoinedAt: booking.firstJoinedAt?.toISOString() || null,
      lastJoinedAt: booking.lastJoinedAt?.toISOString() || null,
      lastLeftAt: booking.lastLeftAt?.toISOString() || null,
      joinCount: booking.joinCount,
      attendanceSource: booking.attendanceSource,
      healthConditions:
        scope === "owner_admin"
          ? (booking.user.healthProfile?.selections || []).map((selection) =>
              toHealthConditionLabel(selection.conditionKey, selection.detail)
            )
          : toAssignedInstructorHealthSummary(booking.user.healthProfile?.selections.length || 0),
      attendedClassesCount:
        scope === "owner_admin" ? attendanceByUserId.get(booking.userId) || 0 : 0,
      preClassEnergyLevel: booking.preClassEnergyLevel as 1 | 2 | 3 | 4 | 5 | null,
      preClassFlareToday: Boolean(booking.preClassFlareToday),
      preClassSubmittedAt: booking.preClassSubmittedAt?.toISOString() || null,
    })),
    waitlist: detailedSession.waitlist.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      firstName: entry.user.firstName || "",
      lastName: entry.user.lastName || "",
      email: scope === "owner_admin" ? entry.user.email || "" : "",
      status: entry.status,
      position: entry.position,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export async function getClassSessionDetail(
  sessionId: string,
  currentUserId?: string
): Promise<ClassSessionDetailDto | null> {
  return getClassSessionDetailForScope(sessionId, currentUserId, "owner_admin");
}

function buildWeeklyDates(startDate: string, repeatWeeks: number, weekdays: number[]) {
  const [year, month, day] = startDate.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const uniqueWeekdays = Array.from(new Set(weekdays))
    .filter((d) => d >= 0 && d <= 6)
    .sort();
  const all: Date[] = [];

  for (let week = 0; week < repeatWeeks; week += 1) {
    for (const weekday of uniqueWeekdays) {
      const base = new Date(start);
      base.setUTCDate(base.getUTCDate() + week * 7);
      const currentWeekday = base.getUTCDay();
      const delta = weekday - currentWeekday;
      base.setUTCDate(base.getUTCDate() + delta);
      if (base < start) {
        base.setUTCDate(base.getUTCDate() + 7);
      }
      all.push(base);
    }
  }

  return all.map((d) => d.toISOString().slice(0, 10)).sort();
}

export async function bulkCreateClassSessions(
  input: BulkCreateSessionsInput,
  fallbackInstructorUserId: string
) {
  const classDef = await getClassDefinitionBySlug(input.classDefinitionSlug);
  if (!classDef) {
    throw new Error("CLASS_DEFINITION_NOT_FOUND");
  }

  if (!input.repeatWeeks || input.repeatWeeks < 1 || input.repeatWeeks > 52) {
    throw new Error("INVALID_REPEAT_WEEKS");
  }

  const days = input.weekdays.length
    ? input.weekdays
    : [new Date(`${input.startDate}T00:00:00Z`).getUTCDay()];
  const dateStrings = buildWeeklyDates(input.startDate, input.repeatWeeks, days);

  const instructorUserId = input.instructorUserId || fallbackInstructorUserId;
  const { instructorUser, resolvedProfileEntryId, instructorNameSnapshot, instructorBioSnapshot } =
    await resolveClassInstructorSnapshot({
      classDefinitionSlug: classDef.slug,
      instructorUserId,
      instructorProfileEntryId: input.instructorProfileEntryId || null,
    });

  const created = await db.$transaction(async (tx) => {
    const records: Array<{ id: string }> = [];

    for (const dateString of dateStrings) {
      const startsAtUtc = toUtcFromLocalDateTime(dateString, input.timeLocal, "Europe/London");
      const endsAtUtc = new Date(startsAtUtc.getTime() + input.durationMinutes * 60_000);
      const roomMode = getClassSessionRoomMode({
        classType: classDef.type,
        capacity: input.capacity,
      });

      const session = await tx.classSession.create({
        data: {
          classDefinitionSlug: classDef.slug,
          localDate: new Date(`${dateString}T00:00:00.000Z`),
          titleSnapshot: classDef.name,
          typeSnapshot: classDef.type,
          durationMinutes: input.durationMinutes,
          levelSnapshot: classDef.level,
          startsAtUtc,
          endsAtUtc,
          timezone: "Europe/London",
          capacity: input.capacity,
          status: ClassSessionStatus.scheduled,
          notes: input.notes || null,
          instructorUserId: instructorUser.id,
          instructorProfileEntryId: resolvedProfileEntryId,
          instructorNameSnapshot,
          instructorBioSnapshot,
          roomSetupStatus: ClassRoomSetupStatus.pending,
          communityModeEnabled: getDefaultCommunityModeForRoomMode(roomMode),
        },
        select: { id: true, startsAtUtc: true, endsAtUtc: true },
      });

      records.push({ id: session.id });
    }

    return records;
  });

  await logClassSessionAction({
    actorUserId: fallbackInstructorUserId,
    actionType: "class_sessions_bulk_created",
    metadataJson: {
      createdSessionIds: created.map((c) => c.id),
      createdCount: created.length,
      classDefinitionSlug: classDef.slug,
      startDate: input.startDate,
      timeLocal: input.timeLocal,
      durationMinutes: input.durationMinutes,
      capacity: input.capacity,
      repeatWeeks: input.repeatWeeks,
      weekdays: days,
      instructorUserId,
      instructorProfileEntryId: input.instructorProfileEntryId || null,
    },
  });

  return {
    createdSessionIds: created.map((c) => c.id),
    dailyConfigured: isDailyConfigured(),
  };
}

export async function setUpSessionRoom(sessionId: string) {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      startsAtUtc: true,
      endsAtUtc: true,
      status: true,
      dailyRoomName: true,
      dailyRoomUrl: true,
      roomSetupStatus: true,
      isRecorded: true,
      recordingScope: true,
      replayAccessDurationDays: true,
      bookings: {
        where: {
          status: {
            in: [
              ClassBookingStatus.booked,
              ClassBookingStatus.attended,
              ClassBookingStatus.no_show,
            ],
          },
        },
        select: {
          id: true,
        },
      },
    },
  });
  if (!session) {
    throw new Error("SESSION_NOT_FOUND");
  }

  if (
    session.status === ClassSessionStatus.draft ||
    session.status === ClassSessionStatus.cancelled ||
    session.status === ClassSessionStatus.completed
  ) {
    await db.classSession.update({
      where: { id: sessionId },
      data: {
        dailyRoomName: null,
        dailyRoomUrl: null,
        roomSetupStatus: ClassRoomSetupStatus.pending,
        roomSetupError: null,
      },
    });
    return { status: "pending" as const };
  }

  if (
    session.dailyRoomName &&
    session.dailyRoomUrl &&
    session.roomSetupStatus === ClassRoomSetupStatus.ready
  ) {
    return { status: "ready" as const };
  }

  if (session.bookings.length === 0) {
    await db.classSession.update({
      where: { id: sessionId },
      data: {
        dailyRoomName: null,
        dailyRoomUrl: null,
        roomSetupStatus: ClassRoomSetupStatus.pending,
        roomSetupError: null,
      },
    });
    return { status: "pending" as const };
  }

  if (!isDailyConfigured()) {
    await db.classSession.update({
      where: { id: sessionId },
      data: {
        roomSetupStatus: ClassRoomSetupStatus.pending,
        roomSetupError: "Daily is not configured",
      },
    });
    return { status: "pending" as const };
  }

  try {
    const room = await createSessionRoom(session.id, session.startsAtUtc, session.endsAtUtc);
    await db.classSession.update({
      where: { id: session.id },
      data: {
        dailyRoomName: room.roomName,
        dailyRoomUrl: room.roomUrl,
        roomSetupStatus: ClassRoomSetupStatus.ready,
        roomSetupError: null,
      },
    });
    if (session.isRecorded) {
      const policy = await resolveReplayPolicyForClassSession(session.id);
      await db.replayAsset.upsert({
        where: { classSessionId: session.id },
        create: {
          resourceType: "class_session",
          classSessionId: session.id,
          dailyRoomName: room.roomName,
          status: "processing",
          deleteAfterAt: policy.deleteAfterAt,
          recordingConfigSnapshotJson: {
            recordingScope: session.recordingScope,
            replayAccessDurationDays: session.replayAccessDurationDays,
          },
        },
        update: {
          dailyRoomName: room.roomName,
          deleteAfterAt: policy.deleteAfterAt,
          recordingConfigSnapshotJson: {
            recordingScope: session.recordingScope,
            replayAccessDurationDays: session.replayAccessDurationDays,
          },
        },
      });
    }
    return { status: "ready" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Daily room";
    await db.classSession.update({
      where: { id: session.id },
      data: {
        roomSetupStatus: ClassRoomSetupStatus.failed,
        roomSetupError: message,
      },
    });
    return { status: "failed" as const, message };
  }
}

export async function tearDownSessionRoom(sessionId: string) {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      dailyRoomName: true,
    },
  });

  if (!session) {
    throw new Error("SESSION_NOT_FOUND");
  }

  if (!session.dailyRoomName) {
    await db.classSession.update({
      where: { id: sessionId },
      data: {
        dailyRoomName: null,
        dailyRoomUrl: null,
        roomSetupStatus: ClassRoomSetupStatus.pending,
        roomSetupError: null,
      },
    });
    return { status: "skipped" as const };
  }

  try {
    if (isDailyConfigured()) {
      await deleteSessionRoom(session.dailyRoomName);
    }

    await db.classSession.update({
      where: { id: sessionId },
      data: {
        dailyRoomName: null,
        dailyRoomUrl: null,
        roomSetupStatus: ClassRoomSetupStatus.pending,
        roomSetupError: null,
      },
    });

    return { status: "removed" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to close Daily room";
    await db.classSession.update({
      where: { id: sessionId },
      data: {
        roomSetupStatus: ClassRoomSetupStatus.failed,
        roomSetupError: message,
      },
    });
    return { status: "failed" as const, message };
  }
}

export async function updateClassSession(
  sessionId: string,
  updates: {
    startsAtUtc?: Date;
    endsAtUtc?: Date;
    capacity?: number;
    status?: ClassSessionStatus;
    notes?: string;
    instructorUserId?: string;
    instructorProfileEntryId?: string | null;
    actorUserId?: string;
  }
) {
  const existing = await db.classSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      classDefinitionSlug: true,
      instructorUserId: true,
      instructorProfileEntryId: true,
      timezone: true,
      startsAtUtc: true,
      endsAtUtc: true,
      capacity: true,
      status: true,
      notes: true,
    },
  });
  if (!existing) {
    throw new Error("SESSION_NOT_FOUND");
  }

  const nextInstructorUserId = updates.instructorUserId ?? existing.instructorUserId;
  const shouldRefreshInstructorSnapshot =
    updates.instructorUserId !== undefined || updates.instructorProfileEntryId !== undefined;
  const nextInstructorSnapshot = shouldRefreshInstructorSnapshot
    ? await resolveClassInstructorSnapshot({
        classDefinitionSlug: existing.classDefinitionSlug,
        instructorUserId: nextInstructorUserId,
        instructorProfileEntryId:
          updates.instructorProfileEntryId !== undefined
            ? updates.instructorProfileEntryId
            : existing.instructorProfileEntryId,
      })
    : null;

  const updated = await db.classSession.update({
    where: { id: sessionId },
    data: {
      startsAtUtc: updates.startsAtUtc,
      endsAtUtc: updates.endsAtUtc,
      localDate: updates.startsAtUtc
        ? toDateOnlyUtcForTimezone(updates.startsAtUtc, existing.timezone)
        : undefined,
      capacity: updates.capacity,
      status: updates.status,
      notes: updates.notes,
      instructorUserId: updates.instructorUserId,
      instructorProfileEntryId:
        updates.instructorProfileEntryId !== undefined
          ? updates.instructorProfileEntryId
          : undefined,
      instructorNameSnapshot: nextInstructorSnapshot?.instructorNameSnapshot,
      instructorBioSnapshot: nextInstructorSnapshot?.instructorBioSnapshot,
    },
  });

  if (updates.status === ClassSessionStatus.completed) {
    await finalizeSessionNoShows(sessionId);
  }

  await logClassSessionAction({
    actorUserId: updates.actorUserId,
    actionType: "class_session_updated",
    targetId: sessionId,
    oldValueJson: {
      startsAtUtc: existing.startsAtUtc.toISOString(),
      endsAtUtc: existing.endsAtUtc.toISOString(),
      capacity: existing.capacity,
      status: existing.status,
      notes: existing.notes,
      instructorUserId: existing.instructorUserId,
      instructorProfileEntryId: existing.instructorProfileEntryId,
    },
    newValueJson: {
      startsAtUtc: updated.startsAtUtc.toISOString(),
      endsAtUtc: updated.endsAtUtc.toISOString(),
      capacity: updated.capacity,
      status: updated.status,
      notes: updated.notes,
      instructorUserId: updated.instructorUserId,
      instructorProfileEntryId: updated.instructorProfileEntryId,
    },
    metadataJson: {
      classDefinitionSlug: existing.classDefinitionSlug,
      completedNoShowsFinalized: updates.status === ClassSessionStatus.completed,
    },
  });

  return updated;
}

export async function rescheduleClassSessionsForWeek(params: {
  weekStart: string;
  dayDelta: number;
  adminUserId: string;
}) {
  void params.adminUserId;
  const weekStartDate = new Date(`${params.weekStart}T00:00:00.000Z`);
  if (Number.isNaN(weekStartDate.getTime())) {
    throw new Error("INVALID_WEEK_START");
  }
  if (
    !Number.isInteger(params.dayDelta) ||
    params.dayDelta === 0 ||
    Math.abs(params.dayDelta) > 14
  ) {
    throw new Error("INVALID_DAY_DELTA");
  }

  const weekEndDate = shiftDate(weekStartDate, 7);
  const now = new Date();

  const sessions = await db.classSession.findMany({
    where: {
      OR: [
        {
          localDate: {
            gte: weekStartDate,
            lt: weekEndDate,
          },
        },
        {
          localDate: null,
          startsAtUtc: {
            gte: weekStartDate,
            lt: weekEndDate,
          },
        },
      ],
    },
    select: {
      id: true,
      status: true,
      startsAtUtc: true,
      endsAtUtc: true,
      localDate: true,
      timezone: true,
    },
    orderBy: {
      startsAtUtc: "asc",
    },
  });

  let updatedCount = 0;
  let skippedCount = 0;

  for (const session of sessions) {
    const canReschedule =
      session.startsAtUtc > now &&
      (session.status === ClassSessionStatus.draft ||
        session.status === ClassSessionStatus.scheduled);

    if (!canReschedule) {
      skippedCount += 1;
      continue;
    }

    const nextStartsAtUtc = shiftDate(session.startsAtUtc, params.dayDelta);
    const nextEndsAtUtc = shiftDate(session.endsAtUtc, params.dayDelta);
    const nextLocalDate = session.localDate
      ? shiftDate(session.localDate, params.dayDelta)
      : toDateOnlyUtcForTimezone(nextStartsAtUtc, session.timezone);

    await db.classSession.update({
      where: { id: session.id },
      data: {
        startsAtUtc: nextStartsAtUtc,
        endsAtUtc: nextEndsAtUtc,
        localDate: nextLocalDate,
      },
    });
    updatedCount += 1;
  }

  return {
    weekStart: params.weekStart,
    weekEndExclusive: weekEndDate.toISOString().slice(0, 10),
    dayDelta: params.dayDelta,
    updatedCount,
    skippedCount,
  };
}

export async function listAdminClassSessions(params: {
  from?: Date;
  to?: Date;
  status?: ClassSessionStatus | "all";
  type?: string | "all";
  currentUserId?: string;
}): Promise<AdminClassSessionDto[]> {
  const rows = await listClassSessions({
    currentUserId: params.currentUserId,
    from: params.from,
    to: params.to,
    statusIn:
      params.status && params.status !== "all"
        ? [params.status]
        : [
            ClassSessionStatus.draft,
            ClassSessionStatus.scheduled,
            ClassSessionStatus.live,
            ClassSessionStatus.completed,
            ClassSessionStatus.cancelled,
          ],
    type: params.type && params.type !== "all" ? params.type : undefined,
  });

  const notesById = await db.classSession.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    select: {
      id: true,
      notes: true,
      cancelReason: true,
      bookings: {
        select: {
          status: true,
        },
      },
    },
  });

  const noteMap = new Map(notesById.map((row) => [row.id, row.notes || ""]));
  const cancelReasonMap = new Map(notesById.map((row) => [row.id, row.cancelReason || null]));
  const attendanceCountMap = new Map(
    notesById.map((row) => [
      row.id,
      {
        attendedCount: row.bookings.filter(
          (booking) => booking.status === ClassBookingStatus.attended
        ).length,
        noShowCount: row.bookings.filter((booking) => booking.status === ClassBookingStatus.no_show)
          .length,
      },
    ])
  );

  return rows.map((row) => ({
    ...row,
    notes: noteMap.get(row.id) || "",
    cancelReason: cancelReasonMap.get(row.id) || null,
    attendedCount: attendanceCountMap.get(row.id)?.attendedCount || 0,
    noShowCount: attendanceCountMap.get(row.id)?.noShowCount || 0,
  }));
}

export async function getScheduleGroupedByDay(params?: {
  currentUserId?: string;
  from?: Date;
  to?: Date;
}): Promise<ScheduleDayDto[]> {
  const from = params?.from || new Date();
  const to =
    clampPublicScheduleEnd(
      from,
      params?.to || new Date(Date.now() + 56 * 86400000),
      params?.currentUserId
    ) || new Date(Date.now() + 28 * 86400000);
  const sessions = await listClassSessions({
    currentUserId: params?.currentUserId,
    from,
    to,
    statusIn: [ClassSessionStatus.scheduled, ClassSessionStatus.live],
  });

  const formatterDay = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    timeZone: "Europe/London",
  });
  const formatterDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  });
  const formatterTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  });

  const grouped = new Map<string, ScheduleDayDto>();
  const classDefinitions = await getClassDefinitions();
  const classBySlug = new Map(classDefinitions.map((cls) => [cls.slug, cls]));

  for (const session of sessions) {
    const starts = new Date(session.startsAtUtc);
    const weekday = formatterDay.format(starts);
    const dateLabel = formatterDate.format(starts);
    const groupKey = `${weekday} ${dateLabel}`;
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, { day: `${weekday} ${dateLabel}`, classes: [] });
    }

    const item: ScheduleClassItemDto = {
      id: session.id,
      sessionId: session.id,
      slug: session.classDefinitionSlug,
      name: session.title,
      type: session.type,
      day: weekday,
      dateLabel,
      startsAtUtc: session.startsAtUtc,
      time: formatterTime.format(starts),
      duration: `${session.durationMinutes} min`,
      level: session.level,
      instructorName: session.instructorName,
      instructorBio: session.instructorBio,
      instructorAvatarUrl: session.instructorAvatarUrl,
      maxSpaces: session.capacity,
      shortDescription: classBySlug.get(session.classDefinitionSlug)?.shortDescription || "",
      spotsRemaining: session.spotsRemaining,
      bookedCount: session.bookedCount,
      status: session.status,
      emptyClassAutoCancelWindowMinutes: session.emptyClassAutoCancelWindowMinutes,
      isBookedByCurrentUser: session.isBookedByCurrentUser,
      waitlistPosition: session.waitlistPosition,
    };

    grouped.get(groupKey)!.classes.push(item);
  }

  const output = Array.from(grouped.values());
  for (const day of output) {
    day.classes.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  }
  return output;
}
