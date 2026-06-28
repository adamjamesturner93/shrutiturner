import type { PublicPricingDto } from "@/lib/api/types";

const RETIRED_PRICING: PublicPricingDto = {
  currency: "GBP",
  source: "fallback",
  membership: {
    movewell: 0,
  },
  membershipDisplay: {
    movewellMonthly: 0,
    movewellAnnual: 0,
    trialDays: 0,
  },
  credits: {
    1: 0,
    3: 0,
    10: 0,
  },
  creditsExpiryDays: 0,
};

export async function getPublicPricing(): Promise<PublicPricingDto> {
  return RETIRED_PRICING;
}
