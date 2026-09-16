import { eventIsoToWallTime, eventWallTimeToIso } from "@/lib/retreats/event-time";
/** Calendar days preserve local wall time across DST; elapsed durations do not. */
export function programmeCalendarDay(
  date: Date,
  days: number,
  time?: string,
  timezone = "Europe/London"
) {
  const wall = eventIsoToWallTime(date.toISOString(), timezone);
  const day = new Date(`${wall.slice(0, 10)}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return new Date(
    eventWallTimeToIso(`${day.toISOString().slice(0, 10)}T${time || wall.slice(11)}`, timezone)
  );
}
