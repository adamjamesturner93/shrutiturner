import { MembershipPlan } from "@prisma/client";

export const MOVEWELL_MONTHLY_PENCE = 2900;
export const MOVEWELL_ANNUAL_PENCE = 29000;
export const MEMBERSHIP_TRIAL_DAYS = 14;
export const CREDITS_EXPIRY_DAYS = 90;

export const MEMBERSHIP_CONFIG: Record<Exclude<MembershipPlan, "instructor">, {
  label: string;
  classesPerWeek: number;
  monthlyPricePence: number;
  annualPricePence: number;
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
}> = {
  movewell: {
    label: "Move Well Membership",
    classesPerWeek: 99,
    monthlyPricePence: MOVEWELL_MONTHLY_PENCE,
    annualPricePence: MOVEWELL_ANNUAL_PENCE,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_MEMBERSHIP_MOVEWELL_MONTHLY || "",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_MEMBERSHIP_MOVEWELL_ANNUAL || "",
  },
};

export const CREDIT_BUNDLE_CONFIG: Record<1 | 3 | 10, {
  label: string;
  credits: number;
  pricePence: number;
  stripePriceId: string;
  expiryDays: number;
}> = {
  1: {
    label: "Drop-in",
    credits: 1,
    pricePence: 900,
    stripePriceId: process.env.STRIPE_PRICE_CREDITS_1 || "",
    expiryDays: CREDITS_EXPIRY_DAYS,
  },
  3: {
    label: "3-class bundle",
    credits: 3,
    pricePence: 2400,
    stripePriceId: process.env.STRIPE_PRICE_CREDITS_3 || "",
    expiryDays: CREDITS_EXPIRY_DAYS,
  },
  10: {
    label: "10-class bundle",
    credits: 10,
    pricePence: 7000,
    stripePriceId: process.env.STRIPE_PRICE_CREDITS_10 || "",
    expiryDays: CREDITS_EXPIRY_DAYS,
  },
};

export function assertPriceConfigured(priceId: string, key: string) {
  if (!priceId) {
    throw new Error(`MISSING_STRIPE_PRICE:${key}`);
  }
}
