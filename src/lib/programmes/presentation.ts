import { cohortStateAt, salesOpen, type CohortTiming } from "./policy";

export function dateLabel(value: string | Date, timezone = "Europe/London") {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
export function timeLabel(value: string | Date, timezone = "Europe/London") {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(value))
    .replace(/\s/g, "");
}
export function dateRange(
  start: string | Date,
  end?: string | Date | null,
  timezone = "Europe/London"
) {
  const a = dateLabel(start, timezone);
  if (!end || a === dateLabel(end, timezone)) return a;
  const parts = (v: string | Date) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(new Date(v));
  const get = (v: string | Date, type: string) => parts(v).find((p) => p.type === type)?.value;
  if (get(start, "year") === get(end, "year")) {
    return `${get(start, "day")}${get(start, "month") === get(end, "month") ? "" : ` ${get(start, "month")}`}–${dateLabel(end, timezone)}`;
  }
  return `${a} – ${dateLabel(end, timezone)}`;
}
export function sessionLabel(value: string | Date, timezone = "Europe/London") {
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
  return `${day} · ${timeLabel(value, timezone)} ${timezone === "Europe/London" ? "UK time" : timezone}`;
}
export type PublicTiming = CohortTiming & {
  publicVisibility: string;
  enrolmentOpen: boolean;
  enrolmentClosesAt: Date | null;
};
export function publiclyVisible(c: PublicTiming, now: Date) {
  const state = cohortStateAt(c, now);
  return (
    c.publicVisibility !== "hidden" &&
    ["coming_soon", "listed"].includes(c.publicVisibility) &&
    !["cancelled", "archived", "follow_up"].includes(state) &&
    (state !== "draft" || c.publicVisibility === "coming_soon")
  );
}
export function publicAvailability(c: PublicTiming, now: Date, full = false) {
  if (cohortStateAt(c, now) === "active") return "In progress";
  if (c.startDate && c.startDate <= now) return "Bookings closed";
  if (c.publicVisibility === "coming_soon") return "Coming soon";
  if (salesOpen(c, now)) return full ? "Fully booked" : "Bookings open";
  return "Bookings closed";
}
export function representative<T extends { startsAt: string | null; availability: string }>(
  cohorts: T[],
  now: Date
): T | undefined {
  const future = cohorts
    .filter((c) => c.startsAt && new Date(c.startsAt) > now)
    .sort((a, b) => a.startsAt!.localeCompare(b.startsAt!));
  return future.find((c) => c.availability === "Bookings open") || future[0];
}
