import type { RetreatCombinedContent, RetreatRoomOptionContent } from "@/lib/content/types";
import {
  getEffectiveRetreatRatePricePence,
  type RetreatRatePlanInput,
} from "@/lib/retreats/pricing";

export type RetreatPriceSummary = {
  lowestPricePence: number;
  isFromPrice: boolean;
};

const DEFAULT_RETREAT_TIMEZONE = "Europe/London";

type RetreatDateParts = {
  day: string;
  month: string;
  year: string;
};

function getRetreatDateParts(date: Date, timezone: string): RetreatDateParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).formatToParts(date);

  return {
    day: (parts.find((part) => part.type === "day")?.value || "").replace(/^0/, ""),
    month: parts.find((part) => part.type === "month")?.value || "",
    year: parts.find((part) => part.type === "year")?.value || "",
  };
}

export function formatRetreatDateTimeRange(
  start: Date | string,
  end: Date | string,
  timezone = DEFAULT_RETREAT_TIMEZONE
) {
  const startsAt = typeof start === "string" ? new Date(start) : start;
  const endsAt = typeof end === "string" ? new Date(end) : end;
  const startParts = getRetreatDateParts(startsAt, timezone);
  const endParts = getRetreatDateParts(endsAt, timezone);
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  });
  const dayMonthFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: timezone,
  });
  const fullDateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  });
  const startTime = timeFormatter.format(startsAt);
  const endTime = timeFormatter.format(endsAt);

  if (
    startParts.day === endParts.day &&
    startParts.month === endParts.month &&
    startParts.year === endParts.year
  ) {
    return `${startTime}-${endTime} ${fullDateFormatter.format(startsAt)}`;
  }

  if (startParts.month === endParts.month && startParts.year === endParts.year) {
    const monthYear = new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: timezone,
    }).format(endsAt);
    return `${startTime} ${startParts.day} - ${endTime} ${endParts.day} ${monthYear}`;
  }

  if (startParts.year === endParts.year) {
    return `${startTime} ${dayMonthFormatter.format(startsAt)} - ${endTime} ${fullDateFormatter.format(endsAt)}`;
  }

  return `${startTime} ${fullDateFormatter.format(startsAt)} - ${endTime} ${fullDateFormatter.format(endsAt)}`;
}

export function getRetreatRoomRatePlans(
  roomOption: RetreatRoomOptionContent
): RetreatRatePlanInput[] {
  if (roomOption.ratePlans?.length) {
    return [...roomOption.ratePlans].sort((left, right) => left.guestCount - right.guestCount);
  }

  return [
    {
      guestCount: roomOption.guestCountPerUnit || roomOption.guestsIncluded || 1,
      totalPricePence: roomOption.normalPricePence,
      earlyBirdPricePence: roomOption.earlyBirdPricePence,
    },
  ];
}

function summarizePrices(prices: number[], fallbackPricePence: number): RetreatPriceSummary {
  const normalizedPrices = prices.length > 0 ? prices : [Math.max(fallbackPricePence, 0)];
  return {
    lowestPricePence: Math.min(...normalizedPrices),
    isFromPrice: new Set(normalizedPrices).size > 1,
  };
}

export function getRetreatRoomOptionPriceSummary(
  roomOption: RetreatRoomOptionContent,
  now: Date = new Date()
): RetreatPriceSummary {
  const prices = getRetreatRoomRatePlans(roomOption).map((ratePlan) =>
    getEffectiveRetreatRatePricePence(ratePlan, now)
  );
  return summarizePrices(prices, roomOption.normalPricePence);
}

export function getRetreatPriceSummary(
  retreat: Pick<RetreatCombinedContent, "dates" | "normalPrice">,
  now: Date = new Date()
): RetreatPriceSummary {
  const prices = retreat.dates.flatMap((date) =>
    date.roomOptions.flatMap((roomOption) =>
      getRetreatRoomRatePlans(roomOption).map((ratePlan) =>
        getEffectiveRetreatRatePricePence(ratePlan, now)
      )
    )
  );
  return summarizePrices(prices, retreat.normalPrice * 100);
}
