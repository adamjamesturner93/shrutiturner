import type { PublicThemedWeek } from "@/lib/themed-weeks/service";

function toTimestamp(value: string | undefined) {
  if (!value) return Number.NaN;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

export function selectScheduleThemedWeek(
  themedWeeks: PublicThemedWeek[],
  now?: Date
): PublicThemedWeek | null {
  const today = new Date(now ?? Date.now());
  today.setHours(0, 0, 0, 0);
  const nowTime = today.getTime();

  const current = themedWeeks
    .filter((week) => {
      const startsAt = toTimestamp(week.startDate);
      const endsAt = toTimestamp(week.endDate);
      return (
        Number.isFinite(startsAt) &&
        Number.isFinite(endsAt) &&
        startsAt <= nowTime &&
        endsAt >= nowTime
      );
    })
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || toTimestamp(a.startDate) - toTimestamp(b.startDate)
    )[0];

  if (current) {
    return current;
  }

  const next = themedWeeks
    .filter((week) => {
      const startsAt = toTimestamp(week.startDate);
      return Number.isFinite(startsAt) && startsAt > nowTime;
    })
    .sort(
      (a, b) => toTimestamp(a.startDate) - toTimestamp(b.startDate) || a.sortOrder - b.sortOrder
    )[0];

  return next ?? null;
}
