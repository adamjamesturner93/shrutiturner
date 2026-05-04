import { db } from "@/lib/db";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

export type ReplayResourceType =
  | "small_group_programme"
  | "small_group_programme_session"
  | "class_session";

export type ReplayPolicy = {
  resourceType: ReplayResourceType;
  entitlementStartsAt: Date;
  entitlementEndsAt: Date;
  deleteAfterAt: Date;
  configId: string;
};

function addMilliseconds(date: Date, ms: number) {
  return new Date(date.getTime() + ms);
}

function getProgrammeEndAnchor(input: {
  endDate: Date | null;
  sessions: Array<{ startsAt: Date; endsAt: Date | null }>;
}) {
  if (input.endDate) {
    return input.endDate;
  }

  const latestSessionEnd =
    input.sessions
      .map((session) => session.endsAt || session.startsAt)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

  return latestSessionEnd || new Date();
}

function getProgrammeLengthMs(input: {
  durationWeeks: number | null;
  startDate: Date | null;
  endDate: Date | null;
  sessions: Array<{ startsAt: Date; endsAt: Date | null }>;
}) {
  if (input.durationWeeks && input.durationWeeks > 0) {
    return input.durationWeeks * WEEK_MS;
  }

  const firstSessionStart =
    input.sessions
      .map((session) => session.startsAt)
      .sort((a, b) => a.getTime() - b.getTime())[0] || null;
  const lastSessionEnd =
    input.sessions
      .map((session) => session.endsAt || session.startsAt)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

  const derivedStart = input.startDate || firstSessionStart;
  const derivedEnd = input.endDate || lastSessionEnd;

  if (derivedStart && derivedEnd && derivedEnd > derivedStart) {
    return Math.max(derivedEnd.getTime() - derivedStart.getTime(), WEEK_MS);
  }

  return WEEK_MS;
}

export async function resolveReplayPolicyForSmallGroupProgramme(
  programmeId: string
): Promise<ReplayPolicy> {
  const programme = await db.smallGroupProgramme.findUniqueOrThrow({
    where: { id: programmeId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      durationWeeks: true,
      sessions: {
        select: {
          startsAt: true,
          endsAt: true,
        },
        orderBy: {
          startsAt: "asc",
        },
      },
    },
  });

  const entitlementStartsAt = getProgrammeEndAnchor({
    endDate: programme.endDate,
    sessions: programme.sessions,
  });
  const lengthMs = getProgrammeLengthMs({
    durationWeeks: programme.durationWeeks,
    startDate: programme.startDate,
    endDate: programme.endDate,
    sessions: programme.sessions,
  });
  const entitlementEndsAt = addMilliseconds(entitlementStartsAt, lengthMs);

  return {
    resourceType: "small_group_programme",
    entitlementStartsAt,
    entitlementEndsAt,
    deleteAfterAt: entitlementEndsAt,
    configId: programme.id,
  };
}

export async function resolveReplayPolicyForSmallGroupProgrammeSession(
  programmeSessionId: string
): Promise<ReplayPolicy> {
  const session = await db.smallGroupProgrammeSession.findUniqueOrThrow({
    where: { id: programmeSessionId },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      programmeId: true,
    },
  });
  const programmePolicy = await resolveReplayPolicyForSmallGroupProgramme(session.programmeId);
  const entitlementStartsAt = session.endsAt || session.startsAt;
  return {
    ...programmePolicy,
    resourceType: "small_group_programme_session",
    entitlementStartsAt,
    configId: session.id,
  };
}

export async function resolveReplayPolicyForClassSession(
  classSessionId: string
): Promise<ReplayPolicy> {
  const session = await db.classSession.findUniqueOrThrow({
    where: { id: classSessionId },
    select: {
      id: true,
      startsAtUtc: true,
      endsAtUtc: true,
      replayAccessDurationDays: true,
    },
  });
  const entitlementStartsAt = session.endsAtUtc || session.startsAtUtc;
  const accessDurationDays = Math.max(1, session.replayAccessDurationDays || 7);
  const entitlementEndsAt = addMilliseconds(entitlementStartsAt, accessDurationDays * DAY_MS);

  return {
    resourceType: "class_session",
    entitlementStartsAt,
    entitlementEndsAt,
    deleteAfterAt: entitlementEndsAt,
    configId: session.id,
  };
}
