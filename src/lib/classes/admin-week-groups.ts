import type { AdminClassSessionDto } from "@/lib/classes/types";

export type AdminClassWeekGroup = {
  weekStart: string;
  weekEndExclusive: string;
  label: string;
  cancelEligibleCount: number;
  sessions: AdminClassSessionDto[];
};

function parseIsoDate(dateString: string) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getSessionLocalDate(
  session: Pick<AdminClassSessionDto, "localDate" | "startsAtUtc">
) {
  return session.localDate || session.startsAtUtc.slice(0, 10);
}

export function getWeekStartIso(dateString: string) {
  const date = parseIsoDate(dateString);
  const weekday = date.getUTCDay();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return toIsoDate(date);
}

export function getWeekEndExclusiveIso(weekStart: string) {
  const date = parseIsoDate(weekStart);
  date.setUTCDate(date.getUTCDate() + 7);
  return toIsoDate(date);
}

export function formatWeekLabel(weekStart: string) {
  const start = parseIsoDate(weekStart);
  const end = parseIsoDate(getWeekEndExclusiveIso(weekStart));
  end.setUTCDate(end.getUTCDate() - 1);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return `Week of ${formatter.format(start)} to ${formatter.format(end)}`;
}

export function canCancelSessionInWeekGroup(
  session: Pick<AdminClassSessionDto, "status" | "startsAtUtc">,
  now = new Date()
) {
  return (
    new Date(session.startsAtUtc) > now &&
    (session.status === "draft" || session.status === "scheduled")
  );
}

export function groupAdminSessionsByWeek(
  sessions: AdminClassSessionDto[],
  now = new Date()
): AdminClassWeekGroup[] {
  const grouped = new Map<string, AdminClassWeekGroup>();

  for (const session of sessions) {
    const weekStart = getWeekStartIso(getSessionLocalDate(session));
    const existing = grouped.get(weekStart);
    if (!existing) {
      grouped.set(weekStart, {
        weekStart,
        weekEndExclusive: getWeekEndExclusiveIso(weekStart),
        label: formatWeekLabel(weekStart),
        cancelEligibleCount: canCancelSessionInWeekGroup(session, now) ? 1 : 0,
        sessions: [session],
      });
      continue;
    }

    existing.sessions.push(session);
    if (canCancelSessionInWeekGroup(session, now)) {
      existing.cancelEligibleCount += 1;
    }
  }

  return Array.from(grouped.values())
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .map((group) => ({
      ...group,
      sessions: [...group.sessions].sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc)),
    }));
}
