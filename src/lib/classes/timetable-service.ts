import { ClassRoomSetupStatus, ClassSessionStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { getClassDefinitions } from "@/lib/content";
import {
  getClassSessionRoomMode,
  getDefaultCommunityModeForRoomMode,
} from "@/lib/classes/room-mode";
import { cancelClassSession } from "@/lib/classes/booking-service";
import { toUtcFromLocalDateTime } from "@/lib/classes/session-service";
import { resolveClassInstructorSnapshot } from "@/lib/instructors/effective-instructor-service";
import type {
  ClassTimetableRuleDto,
  ClassTimetableRuleInput,
  DraftTimetableResultDto,
  PublishTimetableResultDto,
} from "@/lib/classes/types";

const DEFAULT_TIMEZONE = "Europe/London";
const DEFAULT_DRAFT_HORIZON_WEEKS = 8;
const DEFAULT_PUBLISH_HORIZON_WEEKS = 4;

async function logClassTimetableAction(input: {
  actorUserId?: string | null;
  actionType: string;
  targetType: "class_timetable_rule" | "class_session";
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
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    oldValueJson: input.oldValueJson,
    newValueJson: input.newValueJson,
    metadataJson: input.metadataJson,
  });
}

function toDateOnlyUtc(dateString: string) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateRangeEnd(from: Date, horizonWeeks: number) {
  return new Date(from.getTime() + horizonWeeks * 7 * 86_400_000);
}

function getDateRangeEndString(fromDate: string, horizonWeeks: number) {
  return toDateOnlyString(getDateRangeEnd(toDateOnlyUtc(fromDate), horizonWeeks));
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

function clampDateStringToMinimum(...values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort()[0];
}

function getRuleLocalToday(now = new Date(), timezone = DEFAULT_TIMEZONE) {
  return formatDateInTimezone(now, timezone);
}

function assertDateToken(value: string, code: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(code);
  }
}

function getDraftGenerationLimitDate(now = new Date(), timezone = DEFAULT_TIMEZONE) {
  return getDateRangeEndString(getRuleLocalToday(now, timezone), DEFAULT_DRAFT_HORIZON_WEEKS);
}

function getPublishLimitDate(now = new Date(), timezone = DEFAULT_TIMEZONE) {
  return getDateRangeEndString(getRuleLocalToday(now, timezone), DEFAULT_PUBLISH_HORIZON_WEEKS);
}

function validateGenerateUntilDate(
  generateUntil: string,
  now = new Date(),
  timezone = DEFAULT_TIMEZONE
) {
  assertDateToken(generateUntil, "INVALID_GENERATE_UNTIL");
  const localToday = getRuleLocalToday(now, timezone);
  const maxGenerateUntil = getDraftGenerationLimitDate(now, timezone);

  if (generateUntil < localToday) {
    throw new Error("GENERATE_UNTIL_IN_PAST");
  }
  if (generateUntil > maxGenerateUntil) {
    throw new Error("GENERATE_UNTIL_EXCEEDS_PLANNING_WINDOW");
  }

  return {
    localToday,
    maxGenerateUntil,
  };
}

function validatePublishWeekStart(
  weekStart: string,
  now = new Date(),
  timezone = DEFAULT_TIMEZONE
) {
  assertDateToken(weekStart, "INVALID_WEEK_START");
  const localToday = getRuleLocalToday(now, timezone);
  const weekEndExclusive = shiftDateOnlyString(weekStart, 7);
  const publishLimitDate = getPublishLimitDate(now, timezone);

  if (weekEndExclusive <= localToday) {
    throw new Error("PUBLISH_WEEK_IN_PAST");
  }
  if (weekStart > publishLimitDate) {
    throw new Error("PUBLISH_WEEK_OUT_OF_RANGE");
  }

  return {
    localToday,
    publishLimitDate,
    weekEndExclusive,
  };
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
  untilDate?: string | null;
  horizonWeeks?: number;
}) {
  const windowStart = params.fromDate > params.startsOn ? params.fromDate : params.startsOn;
  const horizonEnd =
    params.untilDate ||
    toDateOnlyString(
      getDateRangeEnd(
        toDateOnlyUtc(params.fromDate),
        params.horizonWeeks || DEFAULT_DRAFT_HORIZON_WEEKS
      )
    );
  const windowEnd = clampDateStringToMinimum(params.endsOn || null, horizonEnd) || horizonEnd;

  if (windowEnd < windowStart) {
    return [];
  }

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
  const { classDef, resolvedProfileEntryId, instructorNameSnapshot, instructorBioSnapshot } =
    await resolveClassInstructorSnapshot(rule);

  return {
    classDef,
    resolvedProfileEntryId,
    instructorNameSnapshot,
    instructorBioSnapshot,
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

  await logClassTimetableAction({
    actorUserId: createdByUserId,
    actionType: "class_timetable_rule_created",
    targetType: "class_timetable_rule",
    targetId: rule.id,
    newValueJson: {
      classDefinitionSlug: input.classDefinitionSlug,
      weekday: input.weekday,
      startsAtLocal: input.startsAtLocal,
      durationMinutes: input.durationMinutes,
      timezone,
      defaultCapacity: input.defaultCapacity,
      instructorUserId: input.instructorUserId,
      instructorProfileEntryId: input.instructorProfileEntryId || null,
      startsOn: input.startsOn,
      endsOn,
      active: input.active ?? true,
      exclusionDates,
    },
  });

  return rule;
}

async function createMissingSessionsForRule(
  rule: Prisma.ClassTimetableRuleGetPayload<{
    include: {
      exclusions: true;
    };
  }>,
  options?: {
    fromDate?: Date;
    untilDate?: string;
    horizonWeeks?: number;
    status?: ClassSessionStatus;
  }
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
    untilDate: options?.untilDate,
    horizonWeeks: options?.horizonWeeks || DEFAULT_DRAFT_HORIZON_WEEKS,
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
  options?: { fromDate?: Date; untilDate?: string; horizonWeeks?: number; actorUserId?: string }
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
    untilDate: options?.untilDate,
    horizonWeeks: options?.horizonWeeks,
    status: ClassSessionStatus.draft,
  });

  await logClassTimetableAction({
    actorUserId: options?.actorUserId,
    actionType: "class_timetable_drafts_generated",
    targetType: "class_timetable_rule",
    targetId: timetableRuleId,
    metadataJson: {
      createdSessionIds: result.createdSessionIds,
      createdCount: result.createdSessionIds.length,
      skippedExistingCount: result.skippedExistingCount,
      untilDate: options?.untilDate || null,
      horizonWeeks: options?.horizonWeeks || DEFAULT_DRAFT_HORIZON_WEEKS,
    },
  });

  return {
    createdSessionIds: result.createdSessionIds,
    createdCount: result.createdSessionIds.length,
    skippedExistingCount: result.skippedExistingCount,
  };
}

export async function updateClassTimetableRule(
  timetableRuleId: string,
  input: Partial<ClassTimetableRuleInput>,
  options?: { actorUserId?: string }
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

  await logClassTimetableAction({
    actorUserId: options?.actorUserId,
    actionType: "class_timetable_rule_updated",
    targetType: "class_timetable_rule",
    targetId: timetableRuleId,
    oldValueJson: {
      classDefinitionSlug: existing.classDefinitionSlug,
      weekday: existing.weekday,
      startsAtLocal: existing.startsAtLocal,
      durationMinutes: existing.durationMinutes,
      timezone: existing.timezone,
      defaultCapacity: existing.defaultCapacity,
      instructorUserId: existing.instructorUserId,
      instructorProfileEntryId: existing.instructorProfileEntryId,
      startsOn: toDateOnlyString(existing.startsOn),
      endsOn: existing.endsOn ? toDateOnlyString(existing.endsOn) : null,
      active: existing.active,
      notes: existing.notes,
    },
    newValueJson: {
      classDefinitionSlug: nextClassSlug,
      weekday: nextWeekday,
      startsAtLocal: nextStartsAtLocal,
      durationMinutes: input.durationMinutes ?? existing.durationMinutes,
      timezone: input.timezone ?? existing.timezone,
      defaultCapacity: input.defaultCapacity ?? existing.defaultCapacity,
      instructorUserId: nextInstructorUserId,
      instructorProfileEntryId: nextInstructorProfileEntryId || null,
      startsOn: nextStartsOn,
      endsOn: nextEndsOn,
      active: input.active ?? existing.active,
      notes: input.notes !== undefined ? input.notes || null : existing.notes,
      exclusionDates,
    },
  });
}

export async function deleteClassTimetableRule(
  timetableRuleId: string,
  options?: { actorUserId?: string }
) {
  const existing = await db.classTimetableRule.findUnique({
    where: { id: timetableRuleId },
    select: {
      id: true,
      classDefinitionSlug: true,
      weekday: true,
      startsAtLocal: true,
      durationMinutes: true,
      timezone: true,
      defaultCapacity: true,
      instructorUserId: true,
      instructorProfileEntryId: true,
      startsOn: true,
      endsOn: true,
      active: true,
      notes: true,
    },
  });
  if (!existing) {
    throw new Error("TIMETABLE_NOT_FOUND");
  }

  await db.classTimetableRule.delete({
    where: { id: timetableRuleId },
  });

  await logClassTimetableAction({
    actorUserId: options?.actorUserId,
    actionType: "class_timetable_rule_deleted",
    targetType: "class_timetable_rule",
    targetId: timetableRuleId,
    oldValueJson: {
      classDefinitionSlug: existing.classDefinitionSlug,
      weekday: existing.weekday,
      startsAtLocal: existing.startsAtLocal,
      durationMinutes: existing.durationMinutes,
      timezone: existing.timezone,
      defaultCapacity: existing.defaultCapacity,
      instructorUserId: existing.instructorUserId,
      instructorProfileEntryId: existing.instructorProfileEntryId,
      startsOn: toDateOnlyString(existing.startsOn),
      endsOn: existing.endsOn ? toDateOnlyString(existing.endsOn) : null,
      active: existing.active,
      notes: existing.notes,
    },
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

  await logClassTimetableAction({
    actorUserId: params.endedByUserId,
    actionType: "class_timetable_rule_ended",
    targetType: "class_timetable_rule",
    targetId: params.timetableRuleId,
    reason,
    oldValueJson: {
      endsOn: rule.endsOn ? toDateOnlyString(rule.endsOn) : null,
      active: rule.active,
    },
    newValueJson: {
      endsOn: toDateOnlyString(nextEndsOn),
      active: nextActive,
    },
    metadataJson: {
      mode: params.mode,
      lastClassDate,
      cancelledCount,
      skippedCount,
      cancelledSessionIds: sessionsToCancel.map((session) => session.id),
    },
  });

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
  options?: { fromDate?: Date; untilDate?: string; horizonWeeks?: number; actorUserId?: string }
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
    untilDate: options?.untilDate,
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

  await logClassTimetableAction({
    actorUserId: options?.actorUserId,
    actionType: "class_timetable_rule_published",
    targetType: "class_timetable_rule",
    targetId: timetableRuleId,
    metadataJson: {
      draftCreatedSessionIds: draftResult.createdSessionIds,
      publishedSessionIds: draftSessions.map((session) => session.id),
      draftCreatedCount: draftResult.createdSessionIds.length,
      publishedCount: draftSessions.length,
      skippedExistingCount: draftResult.skippedExistingCount,
      untilDate: options?.untilDate || null,
      horizonWeeks: options?.horizonWeeks || null,
    },
  });

  return {
    draftCreatedSessionIds: draftResult.createdSessionIds,
    publishedSessionIds: draftSessions.map((session) => session.id),
    draftCreatedCount: draftResult.createdSessionIds.length,
    publishedCount: draftSessions.length,
    skippedExistingCount: draftResult.skippedExistingCount,
    failedRoomSetupCount: 0,
    dailyConfigured: true,
  };
}

export async function generateDraftSessionsForActiveClassTimetables(params: {
  generateUntil: string;
  fromDate?: Date;
  actorUserId?: string;
}) {
  const now = params.fromDate || new Date();
  validateGenerateUntilDate(params.generateUntil, now);

  const activeRules = await db.classTimetableRule.findMany({
    where: { active: true },
    select: { id: true },
  });

  const results: Array<{ timetableRuleId: string; result: DraftTimetableResultDto }> = [];
  for (const rule of activeRules) {
    results.push({
      timetableRuleId: rule.id,
      result: await generateDraftSessionsForTimetableRule(rule.id, {
        fromDate: now,
        untilDate: params.generateUntil,
        actorUserId: params.actorUserId,
      }),
    });
  }

  return {
    generateUntil: params.generateUntil,
    timetableCount: activeRules.length,
    createdCount: results.reduce((sum, row) => sum + row.result.createdCount, 0),
    skippedExistingCount: results.reduce((sum, row) => sum + row.result.skippedExistingCount, 0),
    results,
  };
}

export async function publishActiveClassTimetables(options?: {
  fromDate?: Date;
  untilDate?: string;
  horizonWeeks?: number;
  actorUserId?: string;
}) {
  const now = options?.fromDate || new Date();
  const publishUntil = options?.untilDate || getPublishLimitDate(now);

  const activeRules = await db.classTimetableRule.findMany({
    where: { active: true },
    select: { id: true },
  });

  const results: Array<{ timetableRuleId: string; result: PublishTimetableResultDto }> = [];
  for (const rule of activeRules) {
    results.push({
      timetableRuleId: rule.id,
      result: await publishClassTimetableRule(rule.id, {
        fromDate: now,
        untilDate: publishUntil,
        horizonWeeks: options?.horizonWeeks,
        actorUserId: options?.actorUserId,
      }),
    });
  }

  return {
    publishUntil,
    timetableCount: activeRules.length,
    publishedCount: results.reduce((sum, row) => sum + row.result.publishedCount, 0),
    createdDraftCount: results.reduce((sum, row) => sum + row.result.draftCreatedCount, 0),
    results,
  };
}

export async function publishActiveClassTimetablesForWeek(params: {
  weekStart: string;
  fromDate?: Date;
  actorUserId?: string;
}) {
  const now = params.fromDate || new Date();
  const { localToday, publishLimitDate } = validatePublishWeekStart(params.weekStart, now);
  const weekUntil =
    clampDateStringToMinimum(shiftDateOnlyString(params.weekStart, 6), publishLimitDate) ||
    shiftDateOnlyString(params.weekStart, 6);
  const publishFrom = params.weekStart > localToday ? params.weekStart : localToday;

  const activeRules = await db.classTimetableRule.findMany({
    where: { active: true },
    select: { id: true },
  });

  const results: Array<{ timetableRuleId: string; result: PublishTimetableResultDto }> = [];
  for (const rule of activeRules) {
    results.push({
      timetableRuleId: rule.id,
      result: await publishClassTimetableRule(rule.id, {
        fromDate: toDateOnlyUtc(publishFrom),
        untilDate: weekUntil,
        actorUserId: params.actorUserId,
      }),
    });
  }

  return {
    weekStart: params.weekStart,
    publishUntil: weekUntil,
    timetableCount: activeRules.length,
    publishedCount: results.reduce((sum, row) => sum + row.result.publishedCount, 0),
    createdDraftCount: results.reduce((sum, row) => sum + row.result.draftCreatedCount, 0),
    results,
  };
}
