import type { RetreatCombinedContent } from "@/lib/content/types";

/** Input must come from listOperationalRetreats (published, within booking window). */
export function selectNextPublicExperience(retreats: RetreatCombinedContent[], now = Date.now()) {
  return (
    retreats
      .flatMap((retreat) => retreat.dates.map((date) => ({ retreat, date })))
      .filter(
        ({ date }) =>
          date.bookingOpen === true &&
          new Date(date.startDate).getTime() > now &&
          date.availableSpaces > 0 &&
          date.roomOptions.some((room) => room.availableSpots > 0 && !room.isWaitlistOnly)
      )
      .sort(
        (a, b) =>
          new Date(a.date.startDate).getTime() - new Date(b.date.startDate).getTime() ||
          a.date.id.localeCompare(b.date.id)
      )[0] ?? null
  );
}
