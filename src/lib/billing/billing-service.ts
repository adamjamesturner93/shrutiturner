import {
  BillingEventStatus,
  CreditEntryType,
  MembershipBillingInterval,
  MembershipStatus,
  Prisma,
} from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/billing/stripe-client";
import {
  CREDIT_BUNDLE_CONFIG,
  MEMBERSHIP_CONFIG,
  MEMBERSHIP_TRIAL_DAYS,
  assertPriceConfigured,
} from "@/lib/billing/price-map";
import { getActiveCatalogItem, resolvePromotionCodeDiscount } from "@/lib/billing/catalog-service";
import {
  computeReferralDiscountPence,
  consumeReferralDiscount,
} from "@/lib/referrals/referral-discount-service";
import { addCredits } from "@/lib/credits/credit-service";
import { startOrSwitchMembership } from "@/lib/membership/membership-service";
import { qualifyReferral } from "@/lib/referrals/referral-service";
import { processGiftPurchaseCheckoutCompleted } from "@/lib/gifts/service";
import { processRetreatCheckoutCompleted } from "@/lib/retreats/service";
import { processSmallGroupCheckoutCompleted } from "@/lib/small-groups/service";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
  const start = startOfUtcDay(date);
  return new Date(start.getTime() + 86400000);
}

function extractPaidAmountPence(payloadJson: Prisma.JsonValue, type: string) {
  if (!payloadJson || typeof payloadJson !== "object" || Array.isArray(payloadJson)) return 0;
  const root = payloadJson as Record<string, unknown>;
  const data = root.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return 0;
  const obj = (data as Record<string, unknown>).object;
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return 0;
  const o = obj as Record<string, unknown>;
  if (type === "invoice.paid") {
    return typeof o.amount_paid === "number" ? o.amount_paid : 0;
  }
  if (type === "checkout.session.completed") {
    return typeof o.amount_total === "number" ? o.amount_total : 0;
  }
  return 0;
}

export async function recomputeBillingMetricDaily(day: Date) {
  const from = startOfUtcDay(day);
  const to = endOfUtcDay(day);

  const [paidEvents, failedPaymentsCount, activeSubs, churnedMembersCount] = await Promise.all([
    db.billingEvent.findMany({
      where: {
        status: BillingEventStatus.processed,
        type: { in: ["invoice.paid", "checkout.session.completed"] },
        processedAt: { gte: from, lt: to },
      },
      select: { type: true, payloadJson: true },
    }),
    db.billingEvent.count({
      where: {
        status: BillingEventStatus.processed,
        type: "invoice.payment_failed",
        processedAt: { gte: from, lt: to },
      },
    }),
    db.membershipSubscription.findMany({
      where: { status: { in: [MembershipStatus.active, MembershipStatus.past_due] } },
      select: { pricePence: true },
    }),
    db.membershipSubscription.count({
      where: {
        status: { in: [MembershipStatus.cancelled, MembershipStatus.expired] },
        updatedAt: { gte: from, lt: to },
      },
    }),
  ]);

  const cashCollectedPence = paidEvents.reduce(
    (sum, event) => sum + extractPaidAmountPence(event.payloadJson, event.type),
    0
  );
  const mrrPence = activeSubs.reduce((sum, sub) => sum + sub.pricePence, 0);

  await db.billingMetricDaily.upsert({
    where: { date: from },
    create: {
      date: from,
      cashCollectedPence,
      failedPaymentsCount,
      activeMembersCount: activeSubs.length,
      mrrPence,
      churnedMembersCount,
    },
    update: {
      cashCollectedPence,
      failedPaymentsCount,
      activeMembersCount: activeSubs.length,
      mrrPence,
      churnedMembersCount,
    },
  });
}

async function getOrCreateStripeCustomer(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId: user.id },
  });

  await db.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

async function createOneTimeCouponIfNeeded(discountPence: number) {
  if (discountPence <= 0) return null;
  const stripe = getStripeClient();
  return stripe.coupons.create({
    amount_off: discountPence,
    currency: "gbp",
    duration: "once",
    name: "Referral credit",
  });
}

function chooseDiscount(params: { referralPence: number; promoPence: number }) {
  if (params.promoPence > params.referralPence) {
    return { source: "promo" as const, amountPence: params.promoPence };
  }
  if (params.referralPence > 0) {
    return { source: "referral" as const, amountPence: params.referralPence };
  }
  return { source: "none" as const, amountPence: 0 };
}

function bundleToCatalogKey(bundleSize: 1 | 3 | 10) {
  if (bundleSize === 1) return "credits_1" as const;
  if (bundleSize === 3) return "credits_3" as const;
  return "credits_10" as const;
}

function planToCatalogKey(plan: "movewell", billingInterval: MembershipBillingInterval) {
  if (plan === "movewell" && billingInterval === "annual") {
    return "membership_movewell_annual" as const;
  }
  return "membership_movewell_monthly" as const;
}

export async function createCreditCheckoutSession(
  userId: string,
  bundleSize: 1 | 3 | 10,
  promotionCode?: string,
  options?: {
    successPath?: string;
    cancelPath?: string;
  }
) {
  const config = CREDIT_BUNDLE_CONFIG[bundleSize];
  const catalog = await getActiveCatalogItem(bundleToCatalogKey(bundleSize));
  assertPriceConfigured(catalog.stripePriceId, `CATALOG_PRICE_CREDITS_${bundleSize}`);

  const [customerId, referralDiscountPence, promoDiscount] = await Promise.all([
    getOrCreateStripeCustomer(userId),
    computeReferralDiscountPence(userId, catalog.unitAmountPence),
    promotionCode
      ? resolvePromotionCodeDiscount(promotionCode, catalog.unitAmountPence)
      : Promise.resolve(null),
  ]);
  const chosen = chooseDiscount({
    referralPence: referralDiscountPence,
    promoPence: promoDiscount?.discountPence || 0,
  });

  const coupon =
    chosen.source === "referral" ? await createOneTimeCouponIfNeeded(chosen.amountPence) : null;
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    success_url: `${APP_URL}${options?.successPath || "/dashboard/membership?checkout=success"}`,
    cancel_url: `${APP_URL}${options?.cancelPath || "/dashboard/membership?checkout=cancelled"}`,
    line_items: [
      {
        price: catalog.stripePriceId,
        quantity: 1,
      },
    ],
    discounts:
      chosen.source === "promo" && promoDiscount
        ? [{ promotion_code: promoDiscount.promotionCodeId }]
        : coupon
          ? [{ coupon: coupon.id }]
          : undefined,
    metadata: {
      userId,
      kind: "credits",
      bundleSize: String(bundleSize),
      referralDiscountPence: chosen.source === "referral" ? String(chosen.amountPence) : "0",
      promoCode: chosen.source === "promo" ? promoDiscount?.code || "" : "",
      discountSource: chosen.source,
    },
  });

  if (!session.url) {
    throw new Error("STRIPE_CHECKOUT_URL_MISSING");
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    discountPence: chosen.amountPence,
    discountSource: chosen.source,
  };
}

export async function createMembershipCheckoutSession(
  userId: string,
  plan: "movewell",
  billingInterval: MembershipBillingInterval,
  promotionCode?: string,
  offer?: "movewell",
  options?: {
    successPath?: string;
    cancelPath?: string;
  }
) {
  const catalog = await getActiveCatalogItem(planToCatalogKey(plan, billingInterval));
  assertPriceConfigured(catalog.stripePriceId, `CATALOG_PRICE_MEMBERSHIP_${plan.toUpperCase()}`);

  const [customerId, referralDiscountPence, promoDiscount] = await Promise.all([
    getOrCreateStripeCustomer(userId),
    computeReferralDiscountPence(userId, catalog.unitAmountPence),
    promotionCode
      ? resolvePromotionCodeDiscount(promotionCode, catalog.unitAmountPence)
      : Promise.resolve(null),
  ]);
  const chosen = chooseDiscount({
    referralPence: referralDiscountPence,
    promoPence: promoDiscount?.discountPence || 0,
  });

  const coupon =
    chosen.source === "referral" ? await createOneTimeCouponIfNeeded(chosen.amountPence) : null;
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    success_url: `${APP_URL}${options?.successPath || "/dashboard/membership?checkout=success"}`,
    cancel_url: `${APP_URL}${options?.cancelPath || "/dashboard/membership?checkout=cancelled"}`,
    line_items: [{ price: catalog.stripePriceId, quantity: 1 }],
    discounts:
      chosen.source === "promo" && promoDiscount
        ? [{ promotion_code: promoDiscount.promotionCodeId }]
        : coupon
          ? [{ coupon: coupon.id }]
          : undefined,
    subscription_data: {
      trial_period_days: MEMBERSHIP_TRIAL_DAYS,
    },
    metadata: {
      userId,
      kind: "membership",
      plan,
      billingInterval,
      offer: offer || "",
      referralDiscountPence: chosen.source === "referral" ? String(chosen.amountPence) : "0",
      promoCode: chosen.source === "promo" ? promoDiscount?.code || "" : "",
      discountSource: chosen.source,
    },
  });

  if (!session.url) {
    throw new Error("STRIPE_CHECKOUT_URL_MISSING");
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    discountPence: chosen.amountPence,
    discountSource: chosen.source,
  };
}

function unixToDate(unix: number | null | undefined) {
  return unix ? new Date(unix * 1000) : undefined;
}

function getStripeSubscriptionPeriodEnd(
  subscription: Stripe.Subscription | Stripe.Response<Stripe.Subscription>
) {
  return (subscription as Stripe.Subscription & { current_period_end?: number | null })
    .current_period_end;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const subscription = (
    invoice as Stripe.Invoice & {
      subscription?: string | { id?: string | null } | null;
    }
  ).subscription;
  if (typeof subscription === "string") return subscription;
  return subscription?.id || undefined;
}

async function resolvePlanFromStripePriceId(
  stripePriceId?: string | null
): Promise<{ plan: "movewell"; billingInterval: MembershipBillingInterval } | null> {
  if (!stripePriceId) return null;
  if (stripePriceId === MEMBERSHIP_CONFIG.movewell.stripePriceIdMonthly) {
    return { plan: "movewell", billingInterval: "monthly" };
  }
  if (stripePriceId === MEMBERSHIP_CONFIG.movewell.stripePriceIdAnnual) {
    return { plan: "movewell", billingInterval: "annual" };
  }
  const catalog = await db.billingCatalogItem.findFirst({
    where: { stripePriceId, active: true },
    select: { key: true },
  });
  if (catalog?.key === "membership_movewell_monthly") {
    return { plan: "movewell", billingInterval: "monthly" };
  }
  if (catalog?.key === "membership_movewell_annual") {
    return { plan: "movewell", billingInterval: "annual" };
  }
  return null;
}

async function processCheckoutCompleted(event: Stripe.Event, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const kind = session.metadata?.kind;
  const discountPence = Number(session.metadata?.referralDiscountPence || "0") || 0;
  const sourceRef = `stripe:checkout:${session.id}`;

  if (kind === "credits") {
    const bundleSize = Number(session.metadata?.bundleSize || "0");
    if (bundleSize !== 1 && bundleSize !== 3 && bundleSize !== 10) return;

    const alreadyGranted = await db.creditLedgerEntry.findFirst({
      where: { stripeCheckoutSessionId: session.id },
      select: { id: true },
    });
    if (!alreadyGranted) {
      const bundle = CREDIT_BUNDLE_CONFIG[bundleSize];
      const expiresAt = new Date(Date.now() + bundle.expiryDays * 86400000);
      await addCredits({
        userId,
        amount: bundle.credits,
        type: CreditEntryType.purchase,
        description: bundle.label,
        sourceRef,
        expiresAt,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : undefined,
      });
    }

    if (discountPence > 0) {
      const applied = await db.referralLedgerEntry.findFirst({
        where: {
          userId,
          stripeCheckoutSessionId: session.id,
        },
      });
      if (!applied) {
        await consumeReferralDiscount({
          userId,
          amountPence: discountPence,
          description: `Referral credit applied to ${sourceRef}`,
          stripeCheckoutSessionId: session.id,
        });
      }
    }
  }

  if (kind === "membership") {
    const plan = session.metadata?.plan;
    if (plan !== "movewell") return;

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription?.id ?? undefined);
    if (!subscriptionId) return;

    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const item = subscription.items.data[0];
    const stripePriceId = item?.price?.id || undefined;
    const resolved = await resolvePlanFromStripePriceId(stripePriceId);
    const billingIntervalFromMeta =
      session.metadata?.billingInterval === "annual" ? "annual" : "monthly";
    const billingInterval = resolved?.billingInterval || billingIntervalFromMeta;

    await startOrSwitchMembership({
      userId,
      plan,
      billingInterval,
      stripeSubscriptionId: subscription.id,
      stripePriceId,
      nextPeriodEnd: unixToDate(getStripeSubscriptionPeriodEnd(subscription)),
    });

    if (discountPence > 0) {
      const applied = await db.referralLedgerEntry.findFirst({
        where: {
          userId,
          stripeCheckoutSessionId: session.id,
        },
      });
      if (!applied) {
        await consumeReferralDiscount({
          userId,
          amountPence: discountPence,
          description: `Referral credit applied to ${sourceRef}`,
          stripeCheckoutSessionId: session.id,
        });
      }
    }
  }

  if (kind === "credits") {
    await qualifyReferral({
      referredUserId: userId,
      notes: "Auto-qualified on first paid purchase.",
    }).catch(() => null);
  }
}

async function processInvoicePaid(event: Stripe.Event, invoice: Stripe.Invoice) {
  const stripeCustomerId =
    typeof invoice.customer === "string" ? invoice.customer : (invoice.customer?.id ?? null);
  if (!stripeCustomerId) return;

  const user = await db.user.findUnique({
    where: { stripeCustomerId },
    select: { id: true },
  });
  if (!user) return;

  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const line = invoice.lines.data[0] as Stripe.InvoiceLineItem & {
    price?: { id?: string | null } | null;
  };
  const stripePriceId = line?.price?.id || null;
  const resolvedPlan = await resolvePlanFromStripePriceId(stripePriceId);
  if (!resolvedPlan) return;

  await startOrSwitchMembership({
    userId: user.id,
    plan: resolvedPlan.plan,
    billingInterval: resolvedPlan.billingInterval,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: stripePriceId || undefined,
    nextPeriodEnd: unixToDate(line?.period?.end),
  });

  const metadataDiscount = Number(invoice.metadata?.referralDiscountPence || "0") || 0;
  if (metadataDiscount > 0) {
    const alreadyApplied = await db.referralLedgerEntry.findFirst({
      where: {
        userId: user.id,
        stripeInvoiceId: invoice.id,
      },
      select: { id: true },
    });

    if (!alreadyApplied) {
      await consumeReferralDiscount({
        userId: user.id,
        amountPence: metadataDiscount,
        description: `Referral credit applied to invoice ${invoice.id}`,
        stripeInvoiceId: invoice.id,
      });
    }
  }

  await qualifyReferral({
    referredUserId: user.id,
    notes: "Auto-qualified on first paid subscription invoice.",
  }).catch(() => null);
}

async function processInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeCustomerId =
    typeof invoice.customer === "string" ? invoice.customer : (invoice.customer?.id ?? null);
  if (!stripeCustomerId) return;

  const user = await db.user.findUnique({
    where: { stripeCustomerId },
    select: { id: true },
  });
  if (!user) return;

  const membership = await db.membershipSubscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (!membership) return;

  await db.membershipSubscription.update({
    where: { id: membership.id },
    data: {
      status: MembershipStatus.past_due,
    },
  });
}

async function processSubscriptionUpdated(subscription: Stripe.Subscription) {
  const user = await db.user.findUnique({
    where: { stripeCustomerId: String(subscription.customer) },
    select: { id: true },
  });
  if (!user) return;

  const existing = await db.membershipSubscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (!existing) return;

  const status: MembershipStatus =
    subscription.status === "active"
      ? MembershipStatus.active
      : subscription.status === "past_due"
        ? MembershipStatus.past_due
        : subscription.status === "canceled"
          ? MembershipStatus.cancelled
          : subscription.status === "incomplete_expired"
            ? MembershipStatus.expired
            : MembershipStatus.paused;
  const stripePriceId = subscription.items.data[0]?.price?.id || null;
  const resolved = await resolvePlanFromStripePriceId(stripePriceId);
  const resolvedPricePence =
    resolved?.billingInterval === "annual"
      ? MEMBERSHIP_CONFIG.movewell.annualPricePence
      : MEMBERSHIP_CONFIG.movewell.monthlyPricePence;

  await db.membershipSubscription.update({
    where: { id: existing.id },
    data: {
      status,
      billingInterval: resolved?.billingInterval ?? existing.billingInterval,
      pricePence: resolved ? resolvedPricePence : existing.pricePence,
      stripePriceId: stripePriceId || existing.stripePriceId,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      stripeCurrentPeriodEnd: unixToDate(getStripeSubscriptionPeriodEnd(subscription)),
      renewsAt: unixToDate(getStripeSubscriptionPeriodEnd(subscription)),
      endsAt: subscription.cancel_at ? unixToDate(subscription.cancel_at) : null,
    },
  });
}

async function processPromotionCodeUpdated(promotionCode: Stripe.PromotionCode) {
  const coupon = promotionCode.coupon;
  if (!coupon || typeof coupon === "string") return;
  await db.promotionCodeMirror.upsert({
    where: { stripePromotionCodeId: promotionCode.id },
    create: {
      stripeCouponId: coupon.id,
      stripePromotionCodeId: promotionCode.id,
      code: promotionCode.code,
      type: coupon.percent_off ? "percent" : "amount",
      amountOffPence: coupon.amount_off || null,
      percentOff: coupon.percent_off || null,
      currency: coupon.currency ? coupon.currency.toUpperCase() : null,
      active: promotionCode.active,
      expiresAt: promotionCode.expires_at ? new Date(promotionCode.expires_at * 1000) : null,
      maxRedemptions: promotionCode.max_redemptions || null,
      timesRedeemed: promotionCode.times_redeemed || 0,
      metadataJson: promotionCode.metadata,
    },
    update: {
      code: promotionCode.code,
      active: promotionCode.active,
      timesRedeemed: promotionCode.times_redeemed || 0,
      expiresAt: promotionCode.expires_at ? new Date(promotionCode.expires_at * 1000) : null,
      maxRedemptions: promotionCode.max_redemptions || null,
      metadataJson: promotionCode.metadata,
    },
  });
}

async function handleStripeEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const handledRetreat = await processRetreatCheckoutCompleted(session);
    if (handledRetreat) {
      return;
    }
    const handledGift = await processGiftPurchaseCheckoutCompleted(session);
    if (handledGift) {
      return;
    }
    const handledProgramme = await processSmallGroupCheckoutCompleted(session);
    if (!handledProgramme) {
      await processCheckoutCompleted(event, session);
    }
    return;
  }

  if (event.type === "invoice.paid") {
    await processInvoicePaid(event, event.data.object as Stripe.Invoice);
    return;
  }

  if (event.type === "invoice.payment_failed") {
    await processInvoicePaymentFailed(event.data.object as Stripe.Invoice);
    return;
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await processSubscriptionUpdated(event.data.object as Stripe.Subscription);
    return;
  }

  if (event.type === "promotion_code.updated") {
    await processPromotionCodeUpdated(event.data.object as Stripe.PromotionCode);
    return;
  }
}

async function resolveBillingEventUserId(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.metadata?.userId || null;
  }

  if (event.type.startsWith("invoice.")) {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : (invoice.customer?.id ?? null);
    if (!customerId) return null;
    const user = await db.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    return user?.id || null;
  }

  if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = String(subscription.customer);
    const user = await db.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    return user?.id || null;
  }

  return null;
}

export async function processStripeWebhookEvent(event: Stripe.Event) {
  const userId = await resolveBillingEventUserId(event);
  const existing = await db.billingEvent.findUnique({
    where: { providerEventId: event.id },
    select: { id: true, status: true },
  });

  if (existing?.status === BillingEventStatus.processed) {
    return { idempotent: true };
  }

  const billingEvent = existing
    ? await db.billingEvent.update({
        where: { providerEventId: event.id },
        data: {
          status: BillingEventStatus.received,
          payloadJson: event as unknown as Prisma.JsonObject,
          errorMessage: null,
          userId: userId || undefined,
        },
      })
    : await db.billingEvent.create({
        data: {
          provider: "stripe",
          providerEventId: event.id,
          type: event.type,
          status: BillingEventStatus.received,
          payloadJson: event as unknown as Prisma.JsonObject,
          userId: userId || undefined,
        },
      });

  try {
    await handleStripeEvent(event);
    await db.billingEvent.update({
      where: { id: billingEvent.id },
      data: { status: BillingEventStatus.processed, processedAt: new Date() },
    });
    await recomputeBillingMetricDaily(new Date());
    return { idempotent: false };
  } catch (error) {
    await db.billingEvent.update({
      where: { id: billingEvent.id },
      data: {
        status: BillingEventStatus.failed,
        errorMessage: error instanceof Error ? error.message : "Unknown webhook processing error",
      },
    });
    throw error;
  }
}
