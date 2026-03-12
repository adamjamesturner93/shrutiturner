import {
  CREDITS_EXPIRY_DAYS,
  CREDIT_BUNDLE_CONFIG,
  MEMBERSHIP_CONFIG,
  MEMBERSHIP_TRIAL_DAYS,
  MOVEWELL_ANNUAL_PENCE,
} from "@/lib/billing/price-map";
import { getActiveCatalogItem } from "@/lib/billing/catalog-service";
import type { PublicPricingDto } from "@/lib/api/types";

const FALLBACK_PRICING: PublicPricingDto = {
  currency: "GBP",
  source: "fallback",
  membership: {
    movewell: Math.floor(MEMBERSHIP_CONFIG.movewell.monthlyPricePence / 100),
  },
  membershipDisplay: {
    movewellMonthly: Math.floor(MEMBERSHIP_CONFIG.movewell.monthlyPricePence / 100),
    movewellAnnual: Math.floor(MOVEWELL_ANNUAL_PENCE / 100),
    trialDays: MEMBERSHIP_TRIAL_DAYS,
  },
  credits: {
    1: Math.floor(CREDIT_BUNDLE_CONFIG[1].pricePence / 100),
    3: Math.floor(CREDIT_BUNDLE_CONFIG[3].pricePence / 100),
    10: Math.floor(CREDIT_BUNDLE_CONFIG[10].pricePence / 100),
  },
  creditsExpiryDays: CREDITS_EXPIRY_DAYS,
};

export async function getPublicPricing(): Promise<PublicPricingDto> {
  try {
    const [movewellMonthly, movewellAnnual, c1, c3, c10] = await Promise.all([
      getActiveCatalogItem("membership_movewell_monthly"),
      getActiveCatalogItem("membership_movewell_annual"),
      getActiveCatalogItem("credits_1"),
      getActiveCatalogItem("credits_3"),
      getActiveCatalogItem("credits_10"),
    ]);

    return {
      currency: (movewellMonthly.currency || "GBP").toUpperCase(),
      source: "stripe",
      membership: {
        movewell: Math.floor(movewellMonthly.unitAmountPence / 100),
      },
      membershipDisplay: {
        movewellMonthly: Math.floor(movewellMonthly.unitAmountPence / 100),
        movewellAnnual: Math.floor(movewellAnnual.unitAmountPence / 100),
        trialDays: MEMBERSHIP_TRIAL_DAYS,
      },
      credits: {
        1: Math.floor(c1.unitAmountPence / 100),
        3: Math.floor(c3.unitAmountPence / 100),
        10: Math.floor(c10.unitAmountPence / 100),
      },
      creditsExpiryDays: CREDITS_EXPIRY_DAYS,
    };
  } catch {
    return FALLBACK_PRICING;
  }
}
