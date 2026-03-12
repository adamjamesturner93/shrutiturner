import { ClassBookingStatus, ClassSessionStatus, ClassWaitlistStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  getClassDefinitionBySlug,
  getClassDefinitions,
  getInstructorProfilesByIds,
} from "@/lib/content";
import { createSessionRoom, isDailyConfigured } from "@/lib/daily/service";
import { HEALTH_CATEGORIES } from "@/data/health-profile-data";
import type {
  AdminClassSessionDto,
  BulkCreateSessionsInput,
  ClassSessionDetailDto,
  ClassSessionListItemDto,
} from "@/lib/classes/types";

const CONDITION_LABELS = new Map(
  HEALTH_CATEGORIES.flatMap((category) => category.items.map((item) => [item.key, item.label]))
);

function toHealthConditionLabel(conditionKey: string, detail: string | null) {
  if (detail && detail.trim().length > 0) {
    return detail.split("—")[0].split("–")[0].trim();
  }
  return CONDITION_LABELS.get(conditionKey) ?? conditionKey.replaceAll("_", " ");
}

function parseOffsetToMinutes(offsetToken: string): number {
  if (offsetToken === "GMT" || offsetToken === "UTC") return 0;
  const match = offsetToken.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/) ||
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

export function toUtcFromLocalDateTime(localDate: string, localTime: string, timeZone: string): Date {
  const [year, month, day] = localDate.split("-").map(Number);
  const [hour, minute] = localTime.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offsetMinutes * 60_000);
}

function getBookedCount(session: {
  bookings: Array<{ status: ClassBookingStatus }>;
}) {
  return session.bookings.filter((b) => b.status === ClassBookingStatus.booked).length;
}

function getWaitlistCount(session: {
  waitlist: Array<{ status: ClassWaitlistStatus }>;
}) {
  return session.waitlist.filter((w) => w.status === ClassWaitlistStatus.waiting).length;
}

function toSessionListItem(
  session: Prisma.ClassSessionGetPayload<{
    include: {
      bookings: { select: { userId: true; status: true } };
      waitlist: { select: { userId: true; status: true; position: true } };
    };
  }>,
  currentUserId?: string,
  instructorProfile?: { name?: string; bio?: string; avatarImageUrl?: string }
): ClassSessionListItemDto {
  const bookedCount = getBookedCount(session);
  const waitlistCount = getWaitlistCount(session);
  const myBooking = currentUserId
    ? session.bookings.find((b) => b.userId === currentUserId && b.status !== ClassBookingStatus.cancelled)
    : null;
  const myWaitlist = currentUserId
    ? session.waitlist.find((w) => w.userId === currentUserId && w.status === ClassWaitlistStatus.waiting)
    : null;

  return {
    id: session.id,
    classDefinitionSlug: session.classDefinitionSlug,
    title: session.titleSnapshot,
    type: session.typeSnapshot,
    level: session.levelSnapshot,
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
    isBookedByCurrentUser: Boolean(myBooking && myBooking.status === ClassBookingStatus.booked),
    myBookingStatus: myBooking?.status ?? null,
    waitlistPosition: myWaitlist?.position ?? null,
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
  const sessions = await db.classSession.findMany({
    where: {
      startsAtUtc: {
        gte: params.from,
        lte: params.to,
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

  return sessions.map((session) =>
    toSessionListItem(
      session,
      params.currentUserId,
      session.instructorProfileEntryId ? profileById.get(session.instructorProfileEntryId) : undefined
    )
  );
}

export async function getClassSessionDetail(sessionId: string, currentUserId?: string): Promise<ClassSessionDetailDto | null> {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    include: {
      bookings: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
              email: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!session) return null;

  const bookingUserIds = Array.from(new Set(session.bookings.map((booking) => booking.userId)));
  const attendanceCounts = bookingUserIds.length
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

  const profile = session.instructorProfileEntryId
    ? (await getInstructorProfilesByIds([session.instructorProfileEntryId]))[0]
    : undefined;

  const base = toSessionListItem(
    {
      ...session,
      bookings: session.bookings.map((b) => ({ userId: b.userId, status: b.status })),
      waitlist: session.waitlist.map((w) => ({ userId: w.userId, status: w.status, position: w.position })),
    },
    currentUserId,
    profile
  );

  return {
    ...base,
    notes: session.notes || "",
    cancelReason: session.cancelReason,
    bookings: session.bookings.map((booking) => ({
      id: booking.id,
      userId: booking.userId,
      firstName: booking.user.firstName || "",
      lastName: booking.user.lastName || "",
      email: booking.user.email,
      status: booking.status,
      bookedAt: booking.bookedAt.toISOString(),
      healthConditions: (booking.user.healthProfile?.selections || []).map((selection) =>
        toHealthConditionLabel(selection.conditionKey, selection.detail)
      ),
      attendedClassesCount: attendanceByUserId.get(booking.userId) || 0,
    })),
    waitlist: session.waitlist.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      firstName: entry.user.firstName || "",
      lastName: entry.user.lastName || "",
      email: entry.user.email,
      status: entry.status,
      position: entry.position,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

function buildWeeklyDates(startDate: string, repeatWeeks: number, weekdays: number[]) {
  const [year, month, day] = startDate.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const uniqueWeekdays = Array.from(new Set(weekdays)).filter((d) => d >= 0 && d <= 6).sort();
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

  return all
    .map((d) => d.toISOString().slice(0, 10))
    .sort();
}

export async function bulkCreateClassSessions(input: BulkCreateSessionsInput, fallbackInstructorUserId: string) {
  const classDef = await getClassDefinitionBySlug(input.classDefinitionSlug);
  if (!classDef) {
    throw new Error("CLASS_DEFINITION_NOT_FOUND");
  }

  if (!input.repeatWeeks || input.repeatWeeks < 1 || input.repeatWeeks > 52) {
    throw new Error("INVALID_REPEAT_WEEKS");
  }

  const days = input.weekdays.length ? input.weekdays : [new Date(`${input.startDate}T00:00:00Z`).getUTCDay()];
  const dateStrings = buildWeeklyDates(input.startDate, input.repeatWeeks, days);

  const instructorUserId = input.instructorUserId || fallbackInstructorUserId;
  const instructorUser = await db.user.findUnique({
    where: { id: instructorUserId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
      instructorProfileEntryId: true,
    },
  });
  if (!instructorUser) {
    throw new Error("INSTRUCTOR_NOT_FOUND");
  }

  const resolvedProfileEntryId =
    input.instructorProfileEntryId ||
    instructorUser.instructorProfileEntryId ||
    classDef.defaultInstructorProfileEntryId ||
    null;
  const resolvedProfile = resolvedProfileEntryId
    ? (await getInstructorProfilesByIds([resolvedProfileEntryId]))[0]
    : undefined;
  const instructorNameSnapshot =
    resolvedProfile?.name ||
    [instructorUser.firstName, instructorUser.lastName].filter(Boolean).join(" ").trim() ||
    instructorUser.name ||
    null;
  const instructorBioSnapshot = resolvedProfile?.bio || null;

  const created = await db.$transaction(async (tx) => {
    const records: Array<{ id: string }> = [];

    for (const dateString of dateStrings) {
      const startsAtUtc = toUtcFromLocalDateTime(dateString, input.timeLocal, "Europe/London");
      const endsAtUtc = new Date(startsAtUtc.getTime() + input.durationMinutes * 60_000);

      const session = await tx.classSession.create({
        data: {
          classDefinitionSlug: classDef.slug,
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
        },
        select: { id: true, startsAtUtc: true, endsAtUtc: true },
      });

      records.push({ id: session.id });
    }

    return records;
  });

  if (!isDailyConfigured()) {
    return {
      createdSessionIds: created.map((c) => c.id),
      dailyConfigured: false,
    };
  }

  // Daily room creation intentionally happens after DB create to avoid long DB transactions.
  // Failures are bubbled up and can be retried from admin UI.
  for (const createdSession of created) {
    const session = await db.classSession.findUnique({ where: { id: createdSession.id } });
    if (!session) continue;
    const room = await createSessionRoom(session.id, session.startsAtUtc, session.endsAtUtc);
    await db.classSession.update({
      where: { id: session.id },
      data: {
        dailyRoomName: room.roomName,
        dailyRoomUrl: room.roomUrl,
      },
    });
  }

  return {
    createdSessionIds: created.map((c) => c.id),
    dailyConfigured: true,
  };
}

export async function updateClassSession(
  sessionId: string,
  updates: {
    startsAtUtc?: Date;
    endsAtUtc?: Date;
    capacity?: number;
    status?: ClassSessionStatus;
    notes?: string;
  }
) {
  return db.classSession.update({
    where: { id: sessionId },
    data: {
      startsAtUtc: updates.startsAtUtc,
      endsAtUtc: updates.endsAtUtc,
      capacity: updates.capacity,
      status: updates.status,
      notes: updates.notes,
    },
  });
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
        : [ClassSessionStatus.scheduled, ClassSessionStatus.live, ClassSessionStatus.completed, ClassSessionStatus.cancelled],
    type: params.type && params.type !== "all" ? params.type : undefined,
  });

  const notesById = await db.classSession.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    select: { id: true, notes: true },
  });

  const noteMap = new Map(notesById.map((row) => [row.id, row.notes || ""]));

  return rows.map((row) => ({
    ...row,
    notes: noteMap.get(row.id) || "",
  }));
}

export async function getScheduleGroupedByDay(params?: {
  currentUserId?: string;
  from?: Date;
  to?: Date;
}) {
  const from = params?.from || new Date();
  const to = params?.to || new Date(Date.now() + 56 * 86400000);
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

  const grouped = new Map<string, { day: string; classes: Array<Record<string, unknown>> }>();
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

    grouped.get(groupKey)!.classes.push({
      id: session.id,
      sessionId: session.id,
      slug: session.classDefinitionSlug,
      name: session.title,
      type: session.type,
      day: weekday,
      dateLabel,
      time: formatterTime.format(starts),
      duration: `${session.durationMinutes} min`,
      level: session.level,
      instructorName: session.instructorName,
      instructorBio: session.instructorBio,
      instructorAvatarUrl: session.instructorAvatarUrl,
      maxSpaces: session.capacity,
      shortDescription: classBySlug.get(session.classDefinitionSlug)?.shortDescription || "",
      spotsRemaining: session.spotsRemaining,
      status: session.status,
      isBookedByCurrentUser: session.isBookedByCurrentUser,
      waitlistPosition: session.waitlistPosition,
    });
  }

  const output = Array.from(grouped.values());
  for (const day of output) {
    day.classes.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  }
  return output;
}
