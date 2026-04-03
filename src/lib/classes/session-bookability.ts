type SessionStatus = "draft" | "scheduled" | "live" | "completed" | "cancelled";

type SessionBookabilityInput = {
  attendeeCount?: number | null;
  day?: string | null;
  emptyClassAutoCancelWindowMinutes?: number | null;
  startsAtUtc?: Date | string | null;
  status?: SessionStatus | null;
  time?: string | null;
};

type BookingEntitlementInput = {
  hasMembership: boolean;
  membershipClassesRemaining: number;
  totalCredits: number;
};

const DEFAULT_EMPTY_CLASS_AUTO_CANCEL_WINDOW_MINUTES = 180;

const DAY_TO_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function getNextOccurrence(day: string, time: string, now: Date) {
  const targetDay = DAY_TO_INDEX[day];
  if (targetDay === undefined) return null;

  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  const result = new Date(now);
  result.setHours(hours, minutes, 0, 0);

  const currentDay = now.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0 && result <= now) daysUntil = 7;
  result.setDate(result.getDate() + daysUntil);

  return result;
}

export function resolveSessionStart(
  input: Pick<SessionBookabilityInput, "startsAtUtc" | "day" | "time">,
  now = new Date()
) {
  if (input.startsAtUtc) {
    const startsAt =
      input.startsAtUtc instanceof Date ? input.startsAtUtc : new Date(input.startsAtUtc);
    return Number.isNaN(startsAt.getTime()) ? null : startsAt;
  }

  if (!input.day || !input.time) return null;
  return getNextOccurrence(input.day, input.time, now);
}

export function isSessionUnavailableForBooking(input: SessionBookabilityInput, now = new Date()) {
  if (input.status === "cancelled" || input.status === "completed") {
    return true;
  }

  const startsAt = resolveSessionStart(input, now);
  if (!startsAt) return false;

  const attendeeCount = Math.max(0, input.attendeeCount ?? 0);
  const cutoffMinutes =
    input.emptyClassAutoCancelWindowMinutes ?? DEFAULT_EMPTY_CLASS_AUTO_CANCEL_WINDOW_MINUTES;
  const minutesUntilStart = (startsAt.getTime() - now.getTime()) / 60_000;

  return attendeeCount === 0 && minutesUntilStart <= cutoffMinutes && minutesUntilStart > 0;
}

export function getBookingEntitlementText({
  hasMembership,
  membershipClassesRemaining,
  totalCredits,
}: BookingEntitlementInput) {
  if (hasMembership && membershipClassesRemaining > 0) {
    return membershipClassesRemaining === 1
      ? "Included with membership · 1 class left this week"
      : `Included with membership · ${membershipClassesRemaining} classes left this week`;
  }

  if (totalCredits > 0) {
    return totalCredits === 1 ? "1 credit available" : `${totalCredits} credits available`;
  }

  return "Drop-in £12 · Bundles from £9/class";
}
