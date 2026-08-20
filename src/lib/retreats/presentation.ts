import type { RetreatCombinedContent, RetreatRoomOptionContent } from "@/lib/content/types";
import {
  getEffectiveRetreatRatePricePence,
  type RetreatRatePlanInput,
} from "@/lib/retreats/pricing";

export type RetreatPriceSummary = {
  lowestPricePence: number;
  isFromPrice: boolean;
};

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
