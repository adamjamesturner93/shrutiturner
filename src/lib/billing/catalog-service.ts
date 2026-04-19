import type Stripe from "stripe";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { CREDIT_BUNDLE_CONFIG, MEMBERSHIP_CONFIG } from "@/lib/billing/price-map";

export type BillingCatalogKey =
  | "membership_movewell_monthly"
  | "membership_movewell_annual"
  | "credits_1"
  | "credits_3"
  | "credits_10";

const CATALOG_KEYS: BillingCatalogKey[] = [
  "membership_movewell_monthly",
  "membership_movewell_annual",
  "credits_1",
  "credits_3",
  "credits_10",
];

function defaultFromEnv(key: BillingCatalogKey) {
  switch (key) {
    case "membership_movewell_monthly":
      return {
        stripePriceId: MEMBERSHIP_CONFIG.movewell.stripePriceIdMonthly,
        unitAmountPence: MEMBERSHIP_CONFIG.movewell.monthlyPricePence,
      };
    case "membership_movewell_annual":
      return {
        stripePriceId: MEMBERSHIP_CONFIG.movewell.stripePriceIdAnnual,
        unitAmountPence: MEMBERSHIP_CONFIG.movewell.annualPricePence,
      };
    case "credits_1":
      return {
        stripePriceId: CREDIT_BUNDLE_CONFIG[1].stripePriceId,
        unitAmountPence: CREDIT_BUNDLE_CONFIG[1].pricePence,
      };
    case "credits_3":
      return {
        stripePriceId: CREDIT_BUNDLE_CONFIG[3].stripePriceId,
        unitAmountPence: CREDIT_BUNDLE_CONFIG[3].pricePence,
      };
    case "credits_10":
      return {
        stripePriceId: CREDIT_BUNDLE_CONFIG[10].stripePriceId,
        unitAmountPence: CREDIT_BUNDLE_CONFIG[10].pricePence,
      };
    default:
      return { stripePriceId: "", unitAmountPence: 0 };
  }
}

function catalogMetaForKey(key: BillingCatalogKey) {
  const stripe = getStripeClient();
  void stripe;
  switch (key) {
    case "membership_movewell_monthly":
      return {
        name: "Membership · Move Well (Monthly)",
        recurring: "month" as const,
        fallbackPence: MEMBERSHIP_CONFIG.movewell.monthlyPricePence,
      };
    case "membership_movewell_annual":
      return {
        name: "Membership · Move Well (Annual)",
        recurring: "year" as const,
        fallbackPence: MEMBERSHIP_CONFIG.movewell.annualPricePence,
      };
    case "credits_1":
      return {
        name: "Credits · 1 class",
        recurring: null,
        fallbackPence: CREDIT_BUNDLE_CONFIG[1].pricePence,
      };
    case "credits_3":
      return {
        name: "Credits · 3 classes",
        recurring: null,
        fallbackPence: CREDIT_BUNDLE_CONFIG[3].pricePence,
      };
    case "credits_10":
      return {
        name: "Credits · 10 classes",
        recurring: null,
        fallbackPence: CREDIT_BUNDLE_CONFIG[10].pricePence,
      };
  }
}

export async function getActiveCatalogItem(key: BillingCatalogKey) {
  const active = await db.billingCatalogItem.findFirst({
    where: { key, active: true },
    orderBy: { updatedAt: "desc" },
  });
  if (active) return active;

  const fallback = defaultFromEnv(key);
  if (!fallback.stripePriceId) {
    throw new Error(`MISSING_STRIPE_PRICE:${key}`);
  }

  const stripe = getStripeClient();
  const price = await stripe.prices.retrieve(fallback.stripePriceId);
  if (!price.product) {
    throw new Error(`INVALID_PRICE:${fallback.stripePriceId}`);
  }

  const inserted = await db.billingCatalogItem.create({
    data: {
      key,
      stripeProductId: typeof price.product === "string" ? price.product : price.product.id,
      stripePriceId: price.id,
      currency: (price.currency || "gbp").toUpperCase(),
      unitAmountPence: price.unit_amount || fallback.unitAmountPence,
      active: true,
    },
  });

  return inserted;
}

export async function listBillingCatalog() {
  const rows = await db.billingCatalogItem.findMany({
    where: { active: true, key: { in: CATALOG_KEYS } },
    orderBy: [{ key: "asc" }, { updatedAt: "desc" }],
  });

  return CATALOG_KEYS.map((key) => rows.find((row) => row.key === key) || null);
}

async function resolveOrCreateProduct(stripe: Stripe, key: BillingCatalogKey) {
  const existing = await db.billingCatalogItem.findFirst({
    where: { key },
    orderBy: { updatedAt: "desc" },
    select: { stripeProductId: true },
  });
  if (existing?.stripeProductId) return existing.stripeProductId;

  const product = await stripe.products.create({
    name: catalogMetaForKey(key).name,
    metadata: { catalogKey: key },
  });
  return product.id;
}

export async function createOrActivateCatalogPrice(input: {
  key: BillingCatalogKey;
  unitAmountPence: number;
  currency?: string;
  actorUserId?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const stripe = getStripeClient();
  const productId = await resolveOrCreateProduct(stripe, input.key);
  const meta = catalogMetaForKey(input.key);
  const previousActive = await db.billingCatalogItem.findFirst({
    where: { key: input.key, active: true },
    orderBy: { updatedAt: "desc" },
  });

  const price = await stripe.prices.create({
    product: productId,
    currency: (input.currency || "gbp").toLowerCase(),
    unit_amount: input.unitAmountPence,
    recurring: meta.recurring ? { interval: meta.recurring } : undefined,
    metadata: { catalogKey: input.key },
  });

  await db.$transaction(async (tx) => {
    await tx.billingCatalogItem.updateMany({
      where: { key: input.key, active: true },
      data: { active: false },
    });
    await tx.billingCatalogItem.create({
      data: {
        key: input.key,
        stripeProductId: productId,
        stripePriceId: price.id,
        currency: (price.currency || "gbp").toUpperCase(),
        unitAmountPence: price.unit_amount || input.unitAmountPence,
        active: true,
      },
    });
  });

  const result = {
    key: input.key,
    stripePriceId: price.id,
    stripeProductId: productId,
    unitAmountPence: price.unit_amount || input.unitAmountPence,
    currency: (price.currency || "gbp").toUpperCase(),
  };

  if (input.actorUserId) {
    await createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "billing_catalog_price_updated",
      targetType: "billing_catalog_item",
      targetId: input.key,
      requestId: input.requestId,
      requestPath: input.requestPath,
      requestIp: input.requestIp,
      oldValueJson: previousActive,
      newValueJson: result,
    });
  }

  return result;
}

export async function listPromotionCodes() {
  return db.promotionCodeMirror.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createPromotionCode(input: {
  code: string;
  type: "percent" | "amount";
  percentOff?: number;
  amountOffPence?: number;
  currency?: string;
  expiresAt?: string;
  maxRedemptions?: number;
  actorUserId?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const stripe = getStripeClient();

  const coupon = await stripe.coupons.create(
    input.type === "percent"
      ? {
          percent_off: input.percentOff,
          duration: "once",
        }
      : {
          amount_off: input.amountOffPence,
          currency: (input.currency || "gbp").toLowerCase(),
          duration: "once",
        }
  );

  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: input.code,
    max_redemptions: input.maxRedemptions,
    expires_at: input.expiresAt
      ? Math.floor(new Date(input.expiresAt).getTime() / 1000)
      : undefined,
    active: true,
  });

  await db.promotionCodeMirror.upsert({
    where: { stripePromotionCodeId: promo.id },
    create: {
      stripeCouponId: coupon.id,
      stripePromotionCodeId: promo.id,
      code: promo.code,
      type: input.type,
      amountOffPence: coupon.amount_off || null,
      percentOff: coupon.percent_off || null,
      currency: coupon.currency ? coupon.currency.toUpperCase() : null,
      active: promo.active,
      expiresAt: promo.expires_at ? new Date(promo.expires_at * 1000) : null,
      maxRedemptions: promo.max_redemptions || null,
      timesRedeemed: promo.times_redeemed || 0,
      metadataJson: promo.metadata,
    },
    update: {
      code: promo.code,
      type: input.type,
      amountOffPence: coupon.amount_off || null,
      percentOff: coupon.percent_off || null,
      currency: coupon.currency ? coupon.currency.toUpperCase() : null,
      active: promo.active,
      expiresAt: promo.expires_at ? new Date(promo.expires_at * 1000) : null,
      maxRedemptions: promo.max_redemptions || null,
      timesRedeemed: promo.times_redeemed || 0,
      metadataJson: promo.metadata,
    },
  });

  const result = { id: promo.id, code: promo.code, active: promo.active };

  if (input.actorUserId) {
    await createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "promotion_code_created",
      targetType: "promotion_code",
      targetId: promo.id,
      requestId: input.requestId,
      requestPath: input.requestPath,
      requestIp: input.requestIp,
      newValueJson: {
        ...result,
        type: input.type,
        percentOff: input.percentOff || null,
        amountOffPence: input.amountOffPence || null,
        currency: input.currency || "GBP",
        expiresAt: input.expiresAt || null,
        maxRedemptions: input.maxRedemptions || null,
      },
    });
  }

  return result;
}

export async function setPromotionCodeActive(input: {
  id: string;
  active: boolean;
  actorUserId?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const stripe = getStripeClient();
  const previous = await db.promotionCodeMirror.findFirst({
    where: { stripePromotionCodeId: input.id },
    orderBy: { updatedAt: "desc" },
  });
  const updated = await stripe.promotionCodes.update(input.id, { active: input.active });

  await db.promotionCodeMirror.updateMany({
    where: { stripePromotionCodeId: input.id },
    data: { active: updated.active, timesRedeemed: updated.times_redeemed || 0 },
  });

  const result = { id: updated.id, active: updated.active };

  if (input.actorUserId) {
    await createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "promotion_code_updated",
      targetType: "promotion_code",
      targetId: updated.id,
      requestId: input.requestId,
      requestPath: input.requestPath,
      requestIp: input.requestIp,
      oldValueJson: previous,
      newValueJson: result,
    });
  }

  return result;
}

export async function resolvePromotionCodeDiscount(code: string, amountPence: number) {
  const trimmed = code.trim();
  if (!trimmed) return null;
  const stripe = getStripeClient();
  const list = await stripe.promotionCodes.list({ code: trimmed, active: true, limit: 1 });
  const promo = list.data[0];
  if (!promo || !promo.coupon || typeof promo.coupon !== "object") return null;

  const coupon = promo.coupon;
  const percentOff = coupon.percent_off || 0;
  const amountOff = coupon.amount_off || 0;
  const computed = percentOff > 0 ? Math.floor((amountPence * percentOff) / 100) : amountOff;

  await db.promotionCodeMirror.upsert({
    where: { stripePromotionCodeId: promo.id },
    create: {
      stripeCouponId: coupon.id,
      stripePromotionCodeId: promo.id,
      code: promo.code,
      type: percentOff > 0 ? "percent" : "amount",
      amountOffPence: amountOff || null,
      percentOff: percentOff || null,
      currency: coupon.currency ? coupon.currency.toUpperCase() : null,
      active: promo.active,
      expiresAt: promo.expires_at ? new Date(promo.expires_at * 1000) : null,
      maxRedemptions: promo.max_redemptions || null,
      timesRedeemed: promo.times_redeemed || 0,
      metadataJson: promo.metadata,
    },
    update: {
      active: promo.active,
      timesRedeemed: promo.times_redeemed || 0,
    },
  });

  return {
    promotionCodeId: promo.id,
    code: promo.code,
    discountPence: Math.max(0, Math.min(computed, amountPence)),
  };
}
