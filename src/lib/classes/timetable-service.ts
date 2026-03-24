import { ClassRoomSetupStatus, ClassSessionStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  getClassDefinitionBySlug,
  getClassDefinitions,
  getInstructorProfilesByIds,
} from "@/lib/content";
import {
  getClassSessionRoomMode,
  getDefaultCommunityModeForRoomMode,
} from "@/lib/classes/room-mode";
import { cancelClassSession } from "@/lib/classes/booking-service";
import { setUpSessionRoom, toUtcFromLocalDateTime } from "@/lib/classes/session-service";
import type {
  ClassTimetableRuleDto,
  ClassTimetableRuleInput,
  DraftTimetableResultDto,
  PublishTimetableResultDto,
} from "@/lib/classes/types";

const DEFAULT_TIMEZONE = "Europe/London";
const DEFAULT_HORIZON_WEEKS = 8;

function toDateOnlyUtc(dateString: string) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateRangeEnd(from: Date, horizonWeeks: number) {
  return new Date(from.getTime() + horizonWeeks * 7 * 86_400_000);
}

function getSessionGenerationKey(ruleId: string, localDate: string) {
  return `${ruleId}:${localDate}`;
}

function formatDateInTimezone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
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

function shiftDateOnlyString(dateString: string, days: number) {
  const date = toDateOnlyUtc(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateOnlyString(date);
}

function assertWeekday(weekday: number) {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new Error("INVALID_WEEKDAY");
  }
}

function assertTimeToken(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error("INVALID_START_TIME");
  }
}

function normalizeEndsOn(startsOn: string, endsOn?: string) {
  if (!endsOn) return null;
  if (endsOn < startsOn) {
    throw new Error("INVALID_DATE_RANGE");
  }
  return endsOn;
}

function buildGenerationDates(params: {
  startsOn: string;
  endsOn?: string | null;
  weekday: number;
  exclusions: Set<string>;
  fromDate: string;
  horizonWeeks: number;
}) {
  const windowStart = params.fromDate > params.startsOn ? params.fromDate : params.startsOn;
  const windowEnd = params.endsOn
    ? params.endsOn <
      toDateOnlyString(getDateRangeEnd(toDateOnlyUtc(params.fromDate), params.horizonWeeks))
      ? params.endsOn
      : toDateOnlyString(getDateRangeEnd(toDateOnlyUtc(params.fromDate), params.horizonWeeks))
    : toDateOnlyString(getDateRangeEnd(toDateOnlyUtc(params.fromDate), params.horizonWeeks));

  const dates: string[] = [];
  const cursor = toDateOnlyUtc(windowStart);
  const end = toDateOnlyUtc(windowEnd);

  while (cursor <= end) {
    const localDate = toDateOnlyString(cursor);
    if (cursor.getUTCDay() === params.weekday && !params.exclusions.has(localDate)) {
      dates.push(localDate);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

async function resolveRuleSnapshot(rule: {
  classDefinitionSlug: string;
  instructorUserId: string;
  instructorProfileEntryId: string | null;
}) {
  const [classDef, instructorUser] = await Promise.all([
    getClassDefinitionBySlug(rule.classDefinitionSlug),
    db.user.findUnique({
      where: { id: rule.instructorUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        instructorProfileEntryId: true,
      },
    }),
  ]);

  if (!classDef) {
    throw new Error("CLASS_DEFINITION_NOT_FOUND");
  }
  if (!instructorUser) {
    throw new Error("INSTRUCTOR_NOT_FOUND");
  }

  const resolvedProfileEntryId =
    rule.instructorProfileEntryId ||
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

  return {
    classDef,
    resolvedProfileEntryId,
    instructorNameSnapshot,
    instructorBioSnapshot: resolvedProfile?.bio || null,
  };
}

async function replaceExclusions(
  tx: Prisma.TransactionClient,
  timetableRuleId: string,
  exclusionDates: string[]
) {
  await tx.classTimetableExclusion.deleteMany({
    where: { timetableRuleId },
  });

  if (exclusionDates.length === 0) {
    return;
  }

  await tx.classTimetableExclusion.createMany({
    data: exclusionDates.map((dateString) => ({
      timetableRuleId,
      localDate: toDateOnlyUtc(dateString),
    })),
  });
}

function mapRuleDto(
  rule: Prisma.ClassTimetableRuleGetPayload<{
    include: {
      exclusions: true;
      sessions: { select: { startsAtUtc: true; status: true } };
      instructor: { select: { firstName: true; lastName: true; name: true } };
    };
  }>,
  classMap: Map<string, { name: string; type: string }>
): ClassTimetableRuleDto {
  const classDetails = classMap.get(rule.classDefinitionSlug);
  const upcomingSessions = rule.sessions
    .filter((session) => session.status !== ClassSessionStatus.cancelled)
    .sort((a, b) => a.startsAtUtc.getTime() - b.startsAtUtc.getTime());

  return {
    id: rule.id,
    classDefinitionSlug: rule.classDefinitionSlug,
    className: classDetails?.name || rule.classDefinitionSlug,
    classType: classDetails?.type || "Unknown",
    weekday: rule.weekday,
    startsAtLocal: rule.startsAtLocal,
    durationMinutes: rule.durationMinutes,
    timezone: rule.timezone,
    defaultCapacity: rule.defaultCapacity,
    instructorUserId: rule.instructorUserId,
    instructorProfileEntryId: rule.instructorProfileEntryId || null,
    instructorName:
      [rule.instructor.firstName, rule.instructor.lastName].filter(Boolean).join(" ").trim() ||
      rule.instructor.name ||
      null,
    startsOn: toDateOnlyString(rule.startsOn),
    endsOn: rule.endsOn ? toDateOnlyString(rule.endsOn) : null,
    active: rule.active,
    notes: rule.notes || "",
    exclusionDates: rule.exclusions.map((row) => toDateOnlyString(row.localDate)).sort(),
    nextSessionDate: upcomingSessions[0] ? toDateOnlyString(upcomingSessions[0].startsAtUtc) : null,
    generatedSessionCount: rule.sessions.length,
  };
}

export async function listClassTimetableRules(): Promise<ClassTimetableRuleDto[]> {
  const [rules, classDefinitions] = await Promise.all([
    db.classTimetableRule.findMany({
      include: {
        exclusions: {
          orderBy: { localDate: "asc" },
        },
        sessions: {
          select: {
            startsAtUtc: true,
            status: true,
          },
          where: {
            startsAtUtc: {
              gte: new Date(),
            },
          },
        },
        instructor: {
          select: {
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
      orderBy: [{ weekday: "asc" }, { startsAtLocal: "asc" }],
    }),
    getClassDefinitions(),
  ]);

  const classMap = new Map(
    classDefinitions.map((row) => [row.slug, { name: row.name, type: row.type }])
  );
  return rules.map((rule) => mapRuleDto(rule, classMap));
}

export async function createClassTimetableRule(
  input: ClassTimetableRuleInput,
  createdByUserId: string
) {
  assertWeekday(input.weekday);
  assertTimeToken(input.startsAtLocal);
  const endsOn = normalizeEndsOn(input.startsOn, input.endsOn);
  const timezone = input.timezone || DEFAULT_TIMEZONE;
  const exclusionDates = Array.from(new Set((input.exclusionDates || []).filter(Boolean))).sort();

  await resolveRuleSnapshot({
    classDefinitionSlug: input.classDefinitionSlug,
    instructorUserId: input.instructorUserId,
    instructorProfileEntryId: input.instructorProfileEntryId || null,
  });

  const rule = await db.$transaction(async (tx) => {
    const created = await tx.classTimetableRule.create({
      data: {
        classDefinitionSlug: input.classDefinitionSlug,
        weekday: input.weekday,
        startsAtLocal: input.startsAtLocal,
        durationMinutes: input.durationMinutes,
        timezone,
        defaultCapacity: input.defaultCapacity,
        instructorUserId: input.instructorUserId,
        instructorProfileEntryId: input.instructorProfileEntryId || null,
        startsOn: toDateOnlyUtc(input.startsOn),
        endsOn: endsOn ? toDateOnlyUtc(endsOn) : null,
        active: input.active ?? true,
        notes: input.notes || null,
        createdByUserId,
      },
    });

    await replaceExclusions(tx, created.id, exclusionDates);
    return created;
  });

  return rule;
}

async function createMissingSessionsForRule(
  rule: Prisma.ClassTimetableRuleGetPayload<{
    include: {
      exclusions: true;
    };
  }>,
  options?: { fromDate?: Date; horizonWeeks?: number; status?: ClassSessionStatus }
) {
  const { classDef, resolvedProfileEntryId, instructorNameSnapshot, instructorBioSnapshot } =
    await resolveRuleSnapshot(rule);

  const fromDate = options?.fromDate
    ? toDateOnlyString(options.fromDate)
    : toDateOnlyString(new Date());
  const candidateDates = buildGenerationDates({
    startsOn: toDateOnlyString(rule.startsOn),
    endsOn: rule.endsOn ? toDateOnlyString(rule.endsOn) : null,
    weekday: rule.weekday,
    exclusions: new Set(rule.exclusions.map((row) => toDateOnlyString(row.localDate))),
    fromDate,
    horizonWeeks: options?.horizonWeeks || DEFAULT_HORIZON_WEEKS,
  });

  const generationKeys = candidateDates.map((localDate) =>
    getSessionGenerationKey(rule.id, localDate)
  );
  const existing = generationKeys.length
    ? await db.classSession.findMany({
        where: {
          generationKey: { in: generationKeys },
        },
        select: { generationKey: true },
      })
    : [];
  const existingKeys = new Set(
    existing.map((row) => row.generationKey).filter(Boolean) as string[]
  );

  const createdSessionIds = await db.$transaction(async (tx) => {
    const createdIds: string[] = [];

    for (const localDate of candidateDates) {
      const generationKey = getSessionGenerationKey(rule.id, localDate);
      if (existingKeys.has(generationKey)) {
        continue;
      }

      const startsAtUtc = toUtcFromLocalDateTime(localDate, rule.startsAtLocal, rule.timezone);
      const endsAtUtc = new Date(startsAtUtc.getTime() + rule.durationMinutes * 60_000);
      const roomMode = getClassSessionRoomMode({
        classType: classDef.type,
        capacity: rule.defaultCapacity,
      });

      const created = await tx.classSession.create({
        data: {
          classDefinitionSlug: rule.classDefinitionSlug,
          timetableRuleId: rule.id,
          localDate: toDateOnlyUtc(localDate),
          generationKey,
          titleSnapshot: classDef.name,
          typeSnapshot: classDef.type,
          durationMinutes: rule.durationMinutes,
          levelSnapshot: classDef.level,
          startsAtUtc,
          endsAtUtc,
          timezone: rule.timezone,
          capacity: rule.defaultCapacity,
          status: options?.status || ClassSessionStatus.draft,
          notes: rule.notes || null,
          instructorUserId: rule.instructorUserId,
          instructorProfileEntryId: resolvedProfileEntryId,
          instructorNameSnapshot,
          instructorBioSnapshot,
          roomSetupStatus: ClassRoomSetupStatus.pending,
          roomSetupError: null,
          dailyRoomName: null,
          dailyRoomUrl: null,
          communityModeEnabled: getDefaultCommunityModeForRoomMode(roomMode),
        },
        select: { id: true },
      });

      createdIds.push(created.id);
    }

    return createdIds;
  });

  return {
    candidateDates,
    createdSessionIds,
    skippedExistingCount: candidateDates.length - createdSessionIds.length,
  };
}

export async function generateDraftSessionsForTimetableRule(
  timetableRuleId: string,
  options?: { fromDate?: Date; horizonWeeks?: number }
): Promise<DraftTimetableResultDto> {
  const rule = await db.classTimetableRule.findUnique({
    where: { id: timetableRuleId },
    include: {
      exclusions: {
        orderBy: { localDate: "asc" },
      },
    },
  });
  if (!rule) {
    throw new Error("TIMETABLE_NOT_FOUND");
  }

  const result = await createMissingSessionsForRule(rule, {
    fromDate: options?.fromDate,
    horizonWeeks: options?.horizonWeeks,
    status: ClassSessionStatus.draft,
  });

  return {
    createdSessionIds: result.createdSessionIds,
    createdCount: result.createdSessionIds.length,
    skippedExistingCount: result.skippedExistingCount,
  };
}

export async function updateClassTimetableRule(
  timetableRuleId: string,
  input: Partial<ClassTimetableRuleInput>
) {
  const existing = await db.classTimetableRule.findUnique({
    where: { id: timetableRuleId },
  });
  if (!existing) {
    throw new Error("TIMETABLE_NOT_FOUND");
  }

  const nextStartsOn = input.startsOn || toDateOnlyString(existing.startsOn);
  const nextEndsOn = normalizeEndsOn(
    nextStartsOn,
    input.endsOn !== undefined
      ? input.endsOn
      : existing.endsOn
        ? toDateOnlyString(existing.endsOn)
        : undefined
  );
  const nextWeekday = input.weekday ?? existing.weekday;
  const nextStartsAtLocal = input.startsAtLocal ?? existing.startsAtLocal;
  const nextClassSlug = input.classDefinitionSlug ?? existing.classDefinitionSlug;
  const nextInstructorUserId = input.instructorUserId ?? existing.instructorUserId;
  const nextInstructorProfileEntryId =
    input.instructorProfileEntryId !== undefined
      ? input.instructorProfileEntryId
      : existing.instructorProfileEntryId || undefined;

  assertWeekday(nextWeekday);
  assertTimeToken(nextStartsAtLocal);

  await resolveRuleSnapshot({
    classDefinitionSlug: nextClassSlug,
    instructorUserId: nextInstructorUserId,
    instructorProfileEntryId: nextInstructorProfileEntryId || null,
  });

  const exclusionDates = Array.from(
    new Set(
      input.exclusionDates !== undefined
        ? input.exclusionDates.filter(Boolean)
        : (
            await db.classTimetableExclusion.findMany({
              where: { timetableRuleId },
              orderBy: { localDate: "asc" },
              select: { localDate: true },
            })
          ).map((row) => toDateOnlyString(row.localDate))
    )
  ).sort();

  await db.$transaction(async (tx) => {
    await tx.classTimetableRule.update({
      where: { id: timetableRuleId },
      data: {
        classDefinitionSlug: nextClassSlug,
        weekday: nextWeekday,
        startsAtLocal: nextStartsAtLocal,
        durationMinutes: input.durationMinutes ?? existing.durationMinutes,
        timezone: input.timezone ?? existing.timezone,
        defaultCapacity: input.defaultCapacity ?? existing.defaultCapacity,
        instructorUserId: nextInstructorUserId,
        instructorProfileEntryId: nextInstructorProfileEntryId || null,
        startsOn: toDateOnlyUtc(nextStartsOn),
        endsOn: nextEndsOn ? toDateOnlyUtc(nextEndsOn) : null,
        active: input.active ?? existing.active,
        notes: input.notes !== undefined ? input.notes || null : existing.notes,
      },
    });

    await replaceExclusions(tx, timetableRuleId, exclusionDates);
  });
}

export async function deleteClassTimetableRule(timetableRuleId: string) {
  const existing = await db.classTimetableRule.findUnique({
    where: { id: timetableRuleId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("TIMETABLE_NOT_FOUND");
  }

  await db.classTimetableRule.delete({
    where: { id: timetableRuleId },
  });
}

export async function endClassTimetableRule(params: {
  timetableRuleId: string;
  endedByUserId: string;
  mode: "immediate" | "last-class-date";
  lastClassDate?: string;
  reason?: string;
  now?: Date;
}) {
  const rule = await db.classTimetableRule.findUnique({
    where: { id: params.timetableRuleId },
    select: {
      id: true,
      startsOn: true,
      endsOn: true,
      active: true,
      timezone: true,
    },
  });
  if (!rule) {
    throw new Error("TIMETABLE_NOT_FOUND");
  }

  const now = params.now || new Date();
  const localToday = formatDateInTimezone(now, rule.timezone || DEFAULT_TIMEZONE);
  const lastClassDate =
    params.mode === "immediate"
      ? shiftDateOnlyString(localToday, -1)
      : params.lastClassDate?.trim() || "";

  if (params.mode === "last-class-date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastClassDate)) {
      throw new Error("INVALID_LAST_CLASS_DATE");
    }
    normalizeEndsOn(toDateOnlyString(rule.startsOn), lastClassDate);
  }

  const sessionsToCancel = await db.classSession.findMany({
    where: {
      timetableRuleId: params.timetableRuleId,
      status: {
        in: [ClassSessionStatus.draft, ClassSessionStatus.scheduled],
      },
      ...(params.mode === "immediate"
        ? {
            startsAtUtc: {
              gte: now,
            },
          }
        : {
            OR: [
              {
                localDate: {
                  gt: toDateOnlyUtc(lastClassDate),
                },
              },
              {
                localDate: null,
                startsAtUtc: {
                  gt: new Date(`${lastClassDate}T23:59:59.999Z`),
                },
              },
            ],
          }),
    },
    select: {
      id: true,
      status: true,
    },
    orderBy: {
      startsAtUtc: "asc",
    },
  });

  const nextEndsOn =
    params.mode === "immediate" ? toDateOnlyUtc(lastClassDate) : toDateOnlyUtc(lastClassDate);
  const nextActive =
    params.mode === "immediate" ? false : rule.active && lastClassDate >= localToday;

  await db.classTimetableRule.update({
    where: { id: params.timetableRuleId },
    data: {
      endsOn: nextEndsOn,
      active: nextActive,
    },
  });

  let cancelledCount = 0;
  let skippedCount = 0;
  const reason =
    params.reason ||
    (params.mode === "immediate"
      ? "Recurring class removed from the timetable."
      : `Recurring class ends after ${lastClassDate}.`);

  for (const session of sessionsToCancel) {
    const result = await cancelClassSession(session.id, params.endedByUserId, reason);
    if (result.alreadyCancelled) {
      skippedCount += 1;
    } else {
      cancelledCount += 1;
    }
  }

  return {
    mode: params.mode,
    lastClassDate,
    cancelledCount,
    skippedCount,
    active: nextActive,
  };
}

export async function publishClassTimetableRule(
  timetableRuleId: string,
  options?: { fromDate?: Date; horizonWeeks?: number }
): Promise<PublishTimetableResultDto> {
  const rule = await db.classTimetableRule.findUnique({
    where: { id: timetableRuleId },
    include: {
      exclusions: {
        orderBy: { localDate: "asc" },
      },
    },
  });
  if (!rule) {
    throw new Error("TIMETABLE_NOT_FOUND");
  }

  const draftResult = await createMissingSessionsForRule(rule, {
    fromDate: options?.fromDate,
    horizonWeeks: options?.horizonWeeks,
    status: ClassSessionStatus.draft,
  });

  const generationKeys = draftResult.candidateDates.map((localDate) =>
    getSessionGenerationKey(rule.id, localDate)
  );
  const draftSessions = generationKeys.length
    ? await db.classSession.findMany({
        where: {
          generationKey: { in: generationKeys },
          status: ClassSessionStatus.draft,
        },
        select: { id: true },
        orderBy: { startsAtUtc: "asc" },
      })
    : [];

  if (draftSessions.length > 0) {
    await db.classSession.updateMany({
      where: {
        id: {
          in: draftSessions.map((session) => session.id),
        },
      },
      data: {
        status: ClassSessionStatus.scheduled,
      },
    });
  }

  let failedRoomSetupCount = 0;
  for (const sessionId of draftSessions.map((session) => session.id)) {
    const result = await setUpSessionRoom(sessionId);
    if (result.status === "failed") {
      failedRoomSetupCount += 1;
    }
  }

  return {
    draftCreatedSessionIds: draftResult.createdSessionIds,
    publishedSessionIds: draftSessions.map((session) => session.id),
    draftCreatedCount: draftResult.createdSessionIds.length,
    publishedCount: draftSessions.length,
    skippedExistingCount: draftResult.skippedExistingCount,
    failedRoomSetupCount,
    dailyConfigured: draftSessions.length > 0 ? failedRoomSetupCount < draftSessions.length : true,
  };
}

export async function publishActiveClassTimetables(options?: {
  fromDate?: Date;
  horizonWeeks?: number;
}) {
  const activeRules = await db.classTimetableRule.findMany({
    where: { active: true },
    select: { id: true },
  });

  const results: Array<{ timetableRuleId: string; result: PublishTimetableResultDto }> = [];
  for (const rule of activeRules) {
    results.push({
      timetableRuleId: rule.id,
      result: await publishClassTimetableRule(rule.id, options),
    });
  }
  return results;
}
