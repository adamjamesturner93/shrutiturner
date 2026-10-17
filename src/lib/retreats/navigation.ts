import type { RetreatCombinedContent } from "@/lib/content/types";

export type RetreatNavigationItem = {
  slug: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  location: string;
  date: string;
  format: string;
  status: string;
};

export function buildRetreatNavigation(
  retreats: RetreatCombinedContent[],
  now = Date.now()
): RetreatNavigationItem[] {
  return retreats
    .flatMap((retreat) => {
      const dates = retreat.dates
        .filter((date) => new Date(date.endDate).getTime() > now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      const hasPlaces = (item: RetreatCombinedContent["dates"][number]) =>
        item.availableSpaces > 0 &&
        item.roomOptions.some((room) => room.availableSpots > 0 && !room.isWaitlistOnly);
      const date = dates.find(hasPlaces) || dates[0];
      if (!date) return [];
      return [
        {
          slug: retreat.slug,
          title: retreat.title,
          imageUrl: retreat.imageUrl,
          imageAlt: retreat.imageAlt || retreat.title,
          location: date.location || retreat.location,
          date: new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: date.timezone || "Europe/London",
          }).format(new Date(date.startDate)),
          format:
            date.retreatType === "online"
              ? "Online workshop"
              : date.eventKind === "residential_retreat"
                ? "Residential retreat"
                : "In-person event",
          status: hasPlaces(date) ? "Places available" : "Sold out",
          startsAt: new Date(date.startDate).getTime(),
        },
      ];
    })
    .sort((a, b) => a.startsAt - b.startsAt)
    .slice(0, 6);
}
