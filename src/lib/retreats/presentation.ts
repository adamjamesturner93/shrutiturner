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

function formatOrdinalDay(day: string) {
  const value = Number(day);
  const remainder100 = value % 100;
  const suffix =
    remainder100 >= 11 && remainder100 <= 13
      ? "th"
      : value % 10 === 1
        ? "st"
        : value % 10 === 2
          ? "nd"
          : value % 10 === 3
            ? "rd"
            : "th";
  return `${value}${suffix}`;
}

function formatRetreatDayMonth(date: Date, timezone: string) {
  const parts = getRetreatDateParts(date, timezone);
  const month = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: timezone,
  }).format(date);
  return `${formatOrdinalDay(parts.day)} ${month}`;
}

function formatRetreatFullDate(date: Date, timezone: string) {
  const parts = getRetreatDateParts(date, timezone);
  const monthYear = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
  return `${formatOrdinalDay(parts.day)} ${monthYear}`;
}

export function formatRetreatDate(
  value: Date | string,
  timezone = DEFAULT_RETREAT_TIMEZONE,
  includeWeekday = false
) {
  const date = typeof value === "string" ? new Date(value) : value;
  const weekday = includeWeekday
    ? `${new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: timezone }).format(date)}, `
    : "";
  return `${weekday}${formatRetreatFullDate(date, timezone)}`;
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
  const startTime = timeFormatter.format(startsAt);
  const endTime = timeFormatter.format(endsAt);

  if (
    startParts.day === endParts.day &&
    startParts.month === endParts.month &&
    startParts.year === endParts.year
  ) {
    return `${startTime}-${endTime} ${formatRetreatFullDate(startsAt, timezone)}`;
  }

  if (startParts.month === endParts.month && startParts.year === endParts.year) {
    const monthYear = new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: timezone,
    }).format(endsAt);
    return `${startTime} ${formatOrdinalDay(startParts.day)} - ${endTime} ${formatOrdinalDay(endParts.day)} ${monthYear}`;
  }

  if (startParts.year === endParts.year) {
    return `${startTime} ${formatRetreatDayMonth(startsAt, timezone)} - ${endTime} ${formatRetreatFullDate(endsAt, timezone)}`;
  }

  return `${startTime} ${formatRetreatFullDate(startsAt, timezone)} - ${endTime} ${formatRetreatFullDate(endsAt, timezone)}`;
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
