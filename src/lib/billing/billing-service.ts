import {
  BillingEventStatus,
  CreditEntryType,
  MembershipBillingInterval,
  MembershipStatus,
  Prisma,
} from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getBaseSiteUrlFromEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/billing/stripe-client";
import {
  CREDIT_BUNDLE_CONFIG,
  MEMBERSHIP_CONFIG,
  MEMBERSHIP_TRIAL_DAYS,
  assertPriceConfigured,
} from "@/lib/billing/price-map";
import { getActiveCatalogItem, resolvePromotionCodeDiscount } from "@/lib/billing/catalog-service";
import {
  sendMembershipCheckoutConfirmationNotice,
  sendRenewalCoolingOffNotice,
} from "@/lib/billing/subscription-compliance";
import { processStripeDisputeEvent } from "@/lib/billing/dispute-service";
import {
  openMembershipDunningFromInvoice,
  recoverMembershipDunningCase,
} from "@/lib/billing/dunning-service";
import {
  computeReferralDiscountPence,
  consumeReferralDiscount,
} from "@/lib/referrals/referral-discount-service";
import { addCredits } from "@/lib/credits/credit-service";
import { bookClassSession } from "@/lib/classes/booking-service";
import { startOrSwitchMembership } from "@/lib/membership/membership-service";
import { qualifyReferral } from "@/lib/referrals/referral-service";
import { processGiftPurchaseCheckoutCompleted } from "@/lib/gifts/service";
import {
  processRetreatCheckoutCompleted,
  processRetreatRefundUpdated,
} from "@/lib/retreats/service";
import { processSmallGroupCheckoutCompleted } from "@/lib/small-groups/service";
import { getNotificationInbox, sendPostmarkReactEmail } from "@/lib/postmark/client";
import { activeCoachingTiers, coachingTiers, type CoachingOfferKey } from "@/data/marketing";
import CoachingPaymentNotificationEmail from "@/emails/coaching-payment-notification";
import CoachingCancellationNotificationEmail from "@/emails/coaching-cancellation-notification";
import CoachingPaymentConfirmationEmail from "@/emails/coaching-payment-confirmation";
import CoachingCancellationClientEmail from "@/emails/coaching-cancellation-client";
import { upsertCoachingSubscriptionProjection } from "@/lib/billing/coaching-subscription-projection";

const APP_URL = getBaseSiteUrlFromEnv();
const STRIPE_METADATA_VALUE_MAX_LENGTH = 500;

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
  const start = startOfUtcDay(date);
  return new Date(start.getTime() + 86400000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86400000);
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

function compactMembershipComplianceSnapshot(snapshot?: Record<string, unknown>) {
  if (!snapshot) return null;

  const acceptanceStates = Array.isArray(snapshot.acceptanceStates)
    ? snapshot.acceptanceStates
        .filter((state): state is Record<string, unknown> => {
          return Boolean(state) && typeof state === "object" && !Array.isArray(state);
        })
        .map((state) => ({
          type: typeof state.type === "string" ? state.type : undefined,
          acceptanceEventId:
            typeof state.acceptanceEventId === "string" ? state.acceptanceEventId : undefined,
          policyVersionId:
            typeof state.policyVersionId === "string" ? state.policyVersionId : undefined,
          version: typeof state.version === "string" ? state.version : undefined,
        }))
    : [];

  const subscriptionDisclosure =
    snapshot.subscriptionDisclosure &&
    typeof snapshot.subscriptionDisclosure === "object" &&
    !Array.isArray(snapshot.subscriptionDisclosure)
      ? (snapshot.subscriptionDisclosure as Record<string, unknown>)
      : null;

  return {
    acceptanceStates,
    immediateStartAcceptanceEventId:
      typeof snapshot.immediateStartAcceptanceEventId === "string"
        ? snapshot.immediateStartAcceptanceEventId
        : undefined,
    disclosureVersion:
      typeof subscriptionDisclosure?.version === "string"
        ? subscriptionDisclosure.version
        : undefined,
    billingInterval:
      typeof subscriptionDisclosure?.billingInterval === "string"
        ? subscriptionDisclosure.billingInterval
        : undefined,
  };
}

function stringifyStripeMetadataJson(value: unknown) {
  if (!value) return "";
  const serialized = JSON.stringify(value);
  return serialized.length <= STRIPE_METADATA_VALUE_MAX_LENGTH ? serialized : "";
}

function stripeMetadataValue(value: string | undefined | null) {
  if (!value) return "";
  return value.slice(0, STRIPE_METADATA_VALUE_MAX_LENGTH);
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

export async function createBillingPortalSession(
  userId: string,
  options?: {
    returnPath?: string;
  }
) {
  const customerId = await getOrCreateStripeCustomer(userId);
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}${options?.returnPath || "/dashboard/membership"}`,
  });

  if (!session.url) {
    throw new Error("STRIPE_BILLING_PORTAL_URL_MISSING");
  }

  return {
    portalUrl: session.url,
  };
}

function addStripeBillingInterval(
  date: Date,
  interval: NonNullable<Stripe.Price.Recurring["interval"]>,
  intervalCount: number
) {
  const next = new Date(date);
  const count = Math.max(1, intervalCount);
  if (interval === "year") {
    next.setUTCFullYear(next.getUTCFullYear() + count);
  } else if (interval === "month") {
    next.setUTCMonth(next.getUTCMonth() + count);
  } else if (interval === "week") {
    next.setUTCDate(next.getUTCDate() + count * 7);
  } else {
    next.setUTCDate(next.getUTCDate() + count);
  }
  return next;
}

async function getConfiguredCoachingPriceIds() {
  const priceIds = await Promise.all(
    coachingTiers.map(async (tier) => {
      try {
        const catalog = await getActiveCatalogItem(coachingOfferToCatalogKey(tier.id));
        return catalog.stripePriceId || null;
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("MISSING_STRIPE_PRICE:")) {
          return null;
        }
        throw error;
      }
    })
  );
  return new Set(priceIds.filter((priceId): priceId is string => Boolean(priceId)));
}

function subscriptionUsesPrice(subscription: Stripe.Subscription, priceIds: Set<string>) {
  return subscription.items.data.some((item) => {
    const priceId = item.price?.id;
    return priceId ? priceIds.has(priceId) : false;
  });
}

function isOpenSubscriptionStatus(status: Stripe.Subscription.Status) {
  return (
    status === "active" || status === "trialing" || status === "past_due" || status === "unpaid"
  );
}

export async function scheduleCoachingCancellationAfterNextPayment(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) throw new Error("COACHING_SUBSCRIPTION_NOT_FOUND");

  const coachingPriceIds = await getConfiguredCoachingPriceIds();
  if (coachingPriceIds.size === 0) throw new Error("MISSING_STRIPE_PRICE:coaching");

  const stripe = getStripeClient();
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    limit: 100,
  });
  const subscription = subscriptions.data
    .filter((item) => isOpenSubscriptionStatus(item.status))
    .find((item) => subscriptionUsesPrice(item, coachingPriceIds));
  if (!subscription) throw new Error("COACHING_SUBSCRIPTION_NOT_FOUND");

  const firstCoachingItem = subscription.items.data.find((item) =>
    item.price?.id ? coachingPriceIds.has(item.price.id) : false
  );
  const recurring = firstCoachingItem?.price?.recurring;
  if (!recurring?.interval) throw new Error("COACHING_SUBSCRIPTION_NOT_FOUND");

  const currentPeriodEndSeconds = getStripeSubscriptionPeriodEnd(subscription);
  if (!currentPeriodEndSeconds) throw new Error("COACHING_SUBSCRIPTION_NOT_FOUND");

  const nextPaymentAt = new Date(currentPeriodEndSeconds * 1000);
  const endsAt = addStripeBillingInterval(
    nextPaymentAt,
    recurring.interval,
    recurring.interval_count || 1
  );
  const updated = await stripe.subscriptions.update(subscription.id, {
    cancel_at: Math.floor(endsAt.getTime() / 1000),
    metadata: {
      ...subscription.metadata,
      cancellationPolicy: "next_payment_final",
      cancellationRequestedAt: new Date().toISOString(),
      coachingFinalPaymentAt: nextPaymentAt.toISOString(),
      coachingEndsAt: endsAt.toISOString(),
    },
  });
  const updatedCancelAt = updated.cancel_at ? new Date(updated.cancel_at * 1000) : endsAt;
  await db.coachingClientProfile.updateMany({
    where: { userId },
    data: {
      stripeSubscriptionId: subscription.id,
      billingCancellationRequestedAt: new Date(),
      billingFinalPaymentAt: nextPaymentAt,
      billingEndsAt: updatedCancelAt,
    },
  });

  await sendCoachingCancellationNotification({
    userId,
    nextPaymentAt: nextPaymentAt.toISOString(),
    endsAt: updatedCancelAt.toISOString(),
  });

  return {
    subscriptionId: updated.id,
    nextPaymentAt: nextPaymentAt.toISOString(),
    endsAt: updatedCancelAt.toISOString(),
  };
}

export async function stopCoachingRenewalAtCurrentPeriodEnd(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) throw new Error("COACHING_SUBSCRIPTION_NOT_FOUND");

  const coachingPriceIds = await getConfiguredCoachingPriceIds();
  if (coachingPriceIds.size === 0) throw new Error("MISSING_STRIPE_PRICE:coaching");
  const stripe = getStripeClient();
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    limit: 100,
  });
  const subscription = subscriptions.data
    .filter((item) => isOpenSubscriptionStatus(item.status))
    .find((item) => subscriptionUsesPrice(item, coachingPriceIds));
  if (!subscription) throw new Error("COACHING_SUBSCRIPTION_NOT_FOUND");

  const currentPeriodEndSeconds = getStripeSubscriptionPeriodEnd(subscription);
  if (!currentPeriodEndSeconds) throw new Error("COACHING_SUBSCRIPTION_NOT_FOUND");
  const endsAt = new Date(currentPeriodEndSeconds * 1000);
  const requestedAt = new Date();
  const updated = await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
    metadata: {
      ...subscription.metadata,
      cancellationPolicy: "end_current_period",
      cancellationRequestedAt: requestedAt.toISOString(),
      coachingFinalPaymentAt: "",
      coachingEndsAt: endsAt.toISOString(),
    },
  });

  await db.coachingClientProfile.updateMany({
    where: { userId },
    data: {
      stripeSubscriptionId: subscription.id,
      billingCancellationRequestedAt: requestedAt,
      billingFinalPaymentAt: null,
      billingEndsAt: endsAt,
    },
  });
  await upsertCoachingSubscriptionProjection(updated);
  await sendCoachingCancellationNotification({
    userId,
    nextPaymentAt: null,
    endsAt: endsAt.toISOString(),
  });

  return { subscriptionId: updated.id, endsAt: endsAt.toISOString() };
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

function coachingOfferToCatalogKey(offerKey: CoachingOfferKey) {
  return `coaching_${offerKey}_monthly` as const;
}

function getCoachingOfferFromAnswers(answers: Prisma.JsonValue) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return null;
  const offerKey = (answers as Record<string, unknown>).offerKey;
  return typeof offerKey === "string" && activeCoachingTiers.some((tier) => tier.id === offerKey)
    ? (offerKey as CoachingOfferKey)
    : null;
}

function fallbackOfferForTier(tier: string): CoachingOfferKey {
  if (tier === "coached_plan") return "guided_training_plan";
  if (tier === "coaching") return "one_to_one_coaching";
  return "independent_training_plan";
}

function formatEmailDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(typeof value === "string" ? new Date(value) : value);
}

async function sendCoachingPaymentReceivedNotification(input: {
  clientName: string;
  clientEmail: string;
  tierLabel: string;
  applicationId: string;
}) {
  const adminUrl = `${APP_URL}/admin/coaching`;
  await sendPostmarkReactEmail({
    to: getNotificationInbox("COACHING_PAYMENT_NOTIFICATION_EMAIL"),
    subject: `Coaching payment received: ${input.clientName}`,
    react: CoachingPaymentNotificationEmail({
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      tierLabel: input.tierLabel,
      adminUrl,
    }),
    textBody: `Coaching payment received from ${input.clientName}\nEmail: ${input.clientEmail}\nTier: ${input.tierLabel}\n\nCreate or update the client manually in Everfit, then update their setup status in admin.\n\nAdmin: ${adminUrl}`,
    tag: "coaching-payment-received",
    templateKey: "coaching-payment-received",
    metadata: { applicationId: input.applicationId },
    dispatchMode: "immediate_best_effort",
  }).catch((error) => {
    console.error("[billing] failed to send coaching payment notification", error);
  });
}

function coachingTierLabel(tier: string) {
  if (tier === "personal_programme") return "Monthly Support";
  if (tier === "coached_plan") return "Weekly Support";
  if (tier === "coaching") return "1:1 Coaching";
  return "coaching";
}

async function sendCoachingInvoiceConfirmationIfNeeded(
  invoice: Stripe.Invoice,
  subscriptionId: string
) {
  if ((invoice.amount_paid || 0) <= 0) return false;
  const profile = await db.coachingClientProfile.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: {
      user: { select: { id: true, email: true, firstName: true, name: true } },
      application: { select: { recommendedOfferKey: true } },
    },
  });
  if (!profile?.user.email) return false;

  const existing = await db.emailDelivery.findFirst({
    where: {
      templateKey: "coaching-payment-confirmation",
      metadataJson: { path: ["stripeInvoiceId"], equals: invoice.id },
    },
    select: { id: true },
  });
  if (existing) return false;

  const tierLabel =
    coachingTiers.find((tier) => tier.id === profile.application?.recommendedOfferKey)?.name ||
    coachingTierLabel(profile.tier);
  const amountLabel = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: invoice.currency.toUpperCase(),
  }).format((invoice.amount_paid || 0) / 100);
  const invoiceUrl = invoice.hosted_invoice_url || invoice.invoice_pdf || null;
  const dashboardUrl = `${APP_URL}/dashboard/coaching`;

  await sendPostmarkReactEmail({
    to: profile.user.email,
    subject: `Your ${tierLabel} payment is confirmed`,
    react: CoachingPaymentConfirmationEmail({
      firstName: profile.user.firstName || profile.user.name || "there",
      tierLabel,
      amountLabel,
      invoiceUrl,
      dashboardUrl,
    }),
    textBody: `Your ${amountLabel} payment for ${tierLabel} has been received.${invoiceUrl ? `\n\nInvoice: ${invoiceUrl}` : ""}\n\nDashboard: ${dashboardUrl}`,
    tag: "coaching-payment-confirmation",
    templateKey: "coaching-payment-confirmation",
    category: "transactional",
    userId: profile.user.id,
    retryable: true,
    metadata: { stripeInvoiceId: invoice.id, subscriptionId },
    dispatchMode: "immediate_best_effort",
  });
  return true;
}

async function sendCoachingCancellationNotification(input: {
  userId: string;
  nextPaymentAt: string | null;
  endsAt: string;
}) {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { firstName: true, lastName: true, name: true, email: true },
  });
  if (!user) return;

  const clientName =
    user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
  const adminUrl = `${APP_URL}/admin/coaching`;
  const nextPaymentLabel = input.nextPaymentAt ? formatEmailDateTime(input.nextPaymentAt) : null;
  const endsAtLabel = formatEmailDateTime(input.endsAt);

  await Promise.allSettled([
    sendPostmarkReactEmail({
      to: getNotificationInbox("COACHING_CANCELLATION_NOTIFICATION_EMAIL"),
      subject: `Coaching cancellation scheduled: ${clientName}`,
      react: CoachingCancellationNotificationEmail({
        clientName,
        clientEmail: user.email,
        nextPaymentAt: nextPaymentLabel || "No further payment",
        endsAt: endsAtLabel,
        adminUrl,
      }),
      textBody: `Coaching cancellation scheduled for ${clientName}\nEmail: ${user.email}\nFinal payment: ${nextPaymentLabel || "No further payment"}\nBilling/access end: ${endsAtLabel}\n\nPlan the Everfit handover and access changes manually.\n\nAdmin: ${adminUrl}`,
      tag: "coaching-cancellation-scheduled",
      templateKey: "coaching-cancellation-scheduled",
      metadata: { userId: input.userId },
      dispatchMode: "immediate_best_effort",
    }),
    sendPostmarkReactEmail({
      to: user.email,
      subject: "Your coaching cancellation is scheduled",
      react: CoachingCancellationClientEmail({
        firstName: user.firstName || user.name || "there",
        finalPaymentAt: nextPaymentLabel,
        endsAt: endsAtLabel,
        dashboardUrl: `${APP_URL}/dashboard/coaching`,
      }),
      textBody: `Hi ${user.firstName || user.name || "there"},\n\n${nextPaymentLabel ? `Your payment on ${nextPaymentLabel} will be your final coaching payment.` : "No further coaching payments will be collected."}\nYour coaching access continues until ${endsAtLabel}.\n\nDashboard: ${APP_URL}/dashboard/coaching`,
      tag: "coaching-cancellation-client",
      templateKey: "coaching-cancellation-client",
      category: "transactional",
      userId: input.userId,
      retryable: true,
      metadata: { coachingEndsAt: input.endsAt },
      dispatchMode: "immediate_best_effort",
    }),
  ]);
}

export async function createCoachingCheckoutSession(
  userId: string,
  applicationId: string,
  options?: {
    successPath?: string;
    cancelPath?: string;
    offerKeyOverride?: CoachingOfferKey;
    paidStartRequestId?: string;
    billingStartsAt?: Date;
  }
) {
  const application = await db.coachingApplication.findFirst({
    where: {
      id: applicationId,
      userId,
      status: { in: ["approved", "offer_sent", "converted"] },
    },
  });
  if (!application) throw new Error("COACHING_APPLICATION_NOT_APPROVED");

  const offerKey =
    options?.offerKeyOverride ||
    (application.recommendedOfferKey &&
    coachingTiers.some((tier) => tier.active && tier.id === application.recommendedOfferKey)
      ? (application.recommendedOfferKey as CoachingOfferKey)
      : null) ||
    getCoachingOfferFromAnswers(application.answersJson) ||
    fallbackOfferForTier(application.tier);
  if (!activeCoachingTiers.some((tier) => tier.id === offerKey)) {
    throw new Error("COACHING_OFFER_RETIRED");
  }
  const catalog = await getActiveCatalogItem(coachingOfferToCatalogKey(offerKey));
  assertPriceConfigured(catalog.stripePriceId, `CATALOG_PRICE_COACHING_${offerKey}`);

  const [customerId, referralDiscountPence] = await Promise.all([
    getOrCreateStripeCustomer(userId),
    computeReferralDiscountPence(userId, catalog.unitAmountPence),
  ]);
  const coupon = await createOneTimeCouponIfNeeded(referralDiscountPence);
  const stripe = getStripeClient();
  const billingStartSeconds = options?.billingStartsAt
    ? Math.floor(options.billingStartsAt.getTime() / 1000)
    : null;
  const futureBillingStartSeconds =
    billingStartSeconds && billingStartSeconds > Math.floor(Date.now() / 1000) + 60
      ? billingStartSeconds
      : null;
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    customer: customerId,
    success_url: `${APP_URL}${
      options?.successPath ||
      "/dashboard/coaching?checkout=success&session_id={CHECKOUT_SESSION_ID}"
    }`,
    cancel_url: `${APP_URL}${options?.cancelPath || "/dashboard/coaching?checkout=cancelled"}`,
    line_items: [{ price: catalog.stripePriceId, quantity: 1 }],
    discounts: coupon ? [{ coupon: coupon.id }] : undefined,
    metadata: {
      userId,
      kind: "coaching",
      applicationId: application.id,
      offerKey,
      tier: coachingOfferToTier(offerKey),
      coachingPaidStartRequestId: options?.paidStartRequestId || "",
      coachingBillingStartsAt: options?.billingStartsAt?.toISOString() || "",
      referralDiscountPence: referralDiscountPence > 0 ? String(referralDiscountPence) : "0",
      discountSource: referralDiscountPence > 0 ? "referral" : "none",
    },
    subscription_data: {
      trial_end: futureBillingStartSeconds || undefined,
      metadata: {
        userId,
        applicationId: application.id,
        coachingOfferKey: offerKey,
        coachingPaidStartRequestId: options?.paidStartRequestId || "",
        coachingBillingStartsAt: options?.billingStartsAt?.toISOString() || "",
      },
    },
  };
  const session = options?.paidStartRequestId
    ? await stripe.checkout.sessions.create(sessionParams, {
        idempotencyKey: `coaching-paid-start-${options.paidStartRequestId}`,
      })
    : await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) throw new Error("STRIPE_CHECKOUT_URL_MISSING");

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    discountPence: referralDiscountPence,
    discountSource: referralDiscountPence > 0 ? ("referral" as const) : ("none" as const),
  };
}

export async function getCoachingCheckoutReturnState(userId: string, sessionId: string) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription.latest_invoice"],
  });
  if (session.metadata?.kind !== "coaching" || session.metadata?.userId !== userId) {
    throw new Error("COACHING_CHECKOUT_NOT_FOUND");
  }

  const subscription =
    session.subscription && typeof session.subscription !== "string" ? session.subscription : null;
  const latestInvoice =
    subscription?.latest_invoice && typeof subscription.latest_invoice !== "string"
      ? subscription.latest_invoice
      : null;
  return {
    status:
      session.payment_status === "paid"
        ? ("paid" as const)
        : session.status === "complete"
          ? ("processing" as const)
          : ("open" as const),
    amountPence: session.amount_total || latestInvoice?.amount_paid || null,
    currency: (session.currency || latestInvoice?.currency || "gbp").toUpperCase(),
    invoiceUrl: latestInvoice?.hosted_invoice_url || latestInvoice?.invoice_pdf || null,
  };
}

function coachingOfferToTier(offerKey: CoachingOfferKey) {
  return coachingTiers.find((tier) => tier.id === offerKey)?.applicationTier || "coaching";
}

export async function confirmCoachingPackageChangeRequest(
  userId: string,
  packageChangeRequestId: string
) {
  const request = await db.coachingPackageChangeRequest.findFirst({
    where: {
      id: packageChangeRequestId,
      userId,
      status: "pending_client_confirmation",
    },
    include: {
      profile: true,
    },
  });
  if (!request) throw new Error("COACHING_PACKAGE_CHANGE_NOT_FOUND");

  const offerKey = request.toOfferKey as CoachingOfferKey;
  const offer = activeCoachingTiers.find((tier) => tier.id === offerKey);
  if (!offer) throw new Error("COACHING_OFFER_RETIRED");

  if (request.requestType === "paid_start") {
    if (
      request.profile.billingArrangement !== "pro_bono" ||
      request.profile.stripeSubscriptionId ||
      !request.profile.applicationId ||
      !request.billingStartsAt
    ) {
      throw new Error("COACHING_PAID_START_NOT_AVAILABLE");
    }

    const checkout = await createCoachingCheckoutSession(userId, request.profile.applicationId, {
      offerKeyOverride: offerKey,
      paidStartRequestId: request.id,
      billingStartsAt: request.billingStartsAt,
      successPath: "/dashboard/coaching?paid-plan=setup",
      cancelPath: "/dashboard/coaching?paid-plan=cancelled",
    });
    await db.coachingPackageChangeRequest.update({
      where: { id: request.id },
      data: { clientConfirmedAt: new Date() },
    });

    return {
      ...checkout,
      packageChangeRequestId: request.id,
      tier: coachingOfferToTier(offerKey),
      offerKey,
      effectiveMode: request.effectiveMode,
      billingStartsAt: request.billingStartsAt.toISOString(),
    };
  }

  if (!request.profile.stripeSubscriptionId) {
    throw new Error("COACHING_SUBSCRIPTION_NOT_FOUND");
  }

  const catalog = await getActiveCatalogItem(coachingOfferToCatalogKey(offerKey));
  assertPriceConfigured(catalog.stripePriceId, `CATALOG_PRICE_COACHING_${offerKey}`);

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(request.profile.stripeSubscriptionId);
  const coachingPriceIds = await getConfiguredCoachingPriceIds();
  const subscriptionItem =
    subscription.items.data.find((item) =>
      item.price?.id ? coachingPriceIds.has(item.price.id) : false
    ) || subscription.items.data[0];
  if (!subscriptionItem?.id) throw new Error("COACHING_SUBSCRIPTION_NOT_FOUND");

  const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
    items: [
      {
        id: subscriptionItem.id,
        price: catalog.stripePriceId,
      },
    ],
    proration_behavior: request.effectiveMode === "immediate" ? "create_prorations" : "none",
    metadata: {
      ...subscription.metadata,
      coachingPackageChangeRequestId: request.id,
      coachingOfferKey: offerKey,
      coachingPackageChangeConfirmedAt: new Date().toISOString(),
      coachingPackageChangeEffectiveMode: request.effectiveMode,
    },
  });

  const appliedAt = new Date();
  const profile = await db.$transaction(async (tx) => {
    await tx.coachingPackageChangeRequest.update({
      where: { id: request.id },
      data: {
        status: "applied",
        clientConfirmedAt: appliedAt,
        appliedAt,
        stripeSubscriptionId: updatedSubscription.id,
      },
    });
    return tx.coachingClientProfile.update({
      where: { id: request.profileId },
      data: {
        tier: coachingOfferToTier(offerKey),
        billingArrangement: "paid",
        stripeSubscriptionId: updatedSubscription.id,
      },
    });
  });

  await upsertCoachingSubscriptionProjection(updatedSubscription);

  return {
    packageChangeRequestId: request.id,
    subscriptionId: updatedSubscription.id,
    tier: profile.tier,
    offerKey,
    effectiveMode: request.effectiveMode,
  };
}

export async function createCreditCheckoutSession(
  userId: string,
  bundleSize: 1 | 3 | 10,
  promotionCode?: string,
  options?: {
    successPath?: string;
    cancelPath?: string;
    bookingIntent?: {
      classSlug?: string;
      sessionId?: string;
    };
  }
) {
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
      bookingClassSlug: options?.bookingIntent?.classSlug || "",
      bookingSessionId: options?.bookingIntent?.sessionId || "",
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
    disclosureVersion?: string;
    disclosureAcceptedAt?: Date;
    complianceSnapshot?: Record<string, unknown>;
    immediateStartSummary?: string;
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
  const disclosureAcceptedAtIso = options?.disclosureAcceptedAt?.toISOString();
  const complianceSnapshotMetadata = stringifyStripeMetadataJson(
    compactMembershipComplianceSnapshot(options?.complianceSnapshot)
  );

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
      disclosureVersion: options?.disclosureVersion || "",
      disclosureAcceptedAt: disclosureAcceptedAtIso || "",
      immediateStartSummary: stripeMetadataValue(options?.immediateStartSummary),
      complianceSnapshotJson: complianceSnapshotMetadata,
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

    const bookingSessionId = session.metadata?.bookingSessionId;
    if (bookingSessionId) {
      await bookClassSession(bookingSessionId, userId).catch((error) => {
        console.error("[billing] failed to complete post-credit class booking", {
          checkoutSessionId: session.id,
          userId,
          bookingSessionId,
          error,
        });
      });
    }
  }

  if (kind === "coaching") {
    const applicationId = session.metadata?.applicationId;
    const offerKey = session.metadata?.offerKey as CoachingOfferKey | undefined;
    const paidStartRequestId = session.metadata?.coachingPaidStartRequestId || null;
    if (!applicationId || !offerKey || !coachingTiers.some((tier) => tier.id === offerKey)) return;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription?.id ?? null);

    const application = await db.coachingApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application || application.userId !== userId) return;

    const paidStartRequest = paidStartRequestId
      ? await db.coachingPackageChangeRequest.findFirst({
          where: {
            id: paidStartRequestId,
            userId,
            requestType: "paid_start",
          },
          include: { profile: true },
        })
      : null;
    if (paidStartRequestId && !paidStartRequest) return;

    const completedAt = new Date();
    const targetTier = coachingOfferToTier(offerKey);

    await db.$transaction(async (tx) => {
      await tx.coachingApplication.update({
        where: { id: application.id },
        data: {
          status: "converted",
          convertedAt: application.convertedAt || completedAt,
          approvedAt: application.approvedAt || completedAt,
        },
      });

      if (paidStartRequest) {
        const billingStartsAt = paidStartRequest.billingStartsAt || completedAt;
        const billingHasStarted = billingStartsAt.getTime() <= completedAt.getTime();
        await tx.coachingClientProfile.update({
          where: { id: paidStartRequest.profileId },
          data: {
            applicationId: application.id,
            tier: targetTier,
            billingArrangement: billingHasStarted ? "paid" : "pro_bono",
            billingStartsAt,
            stripeSubscriptionId: subscriptionId,
          },
        });
        await tx.coachingPackageChangeRequest.update({
          where: { id: paidStartRequest.id },
          data: {
            status: "applied",
            clientConfirmedAt: paidStartRequest.clientConfirmedAt || completedAt,
            appliedAt: completedAt,
            stripeSubscriptionId: subscriptionId,
          },
        });
      } else {
        await tx.coachingClientProfile.upsert({
          where: { userId },
          create: {
            userId,
            applicationId: application.id,
            tier: targetTier,
            billingArrangement: "paid",
            status: "onboarding",
            stripeSubscriptionId: subscriptionId,
            startDate: completedAt,
            nextCheckInDueAt: new Date(completedAt.getTime() + 7 * 86400000),
          },
          update: {
            applicationId: application.id,
            tier: targetTier,
            billingArrangement: "paid",
            status: "onboarding",
            stripeSubscriptionId: subscriptionId,
            startDate: completedAt,
            nextCheckInDueAt: new Date(completedAt.getTime() + 7 * 86400000),
          },
        });
      }
      await tx.user.update({
        where: { id: userId },
        data: { isCoachingClient: true },
      });
    });

    if (subscriptionId) {
      const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId, {
        expand: ["latest_invoice"],
      });
      await upsertCoachingSubscriptionProjection(subscription);
      const latestInvoice =
        subscription.latest_invoice && typeof subscription.latest_invoice !== "string"
          ? subscription.latest_invoice
          : null;
      if (latestInvoice) {
        await sendCoachingInvoiceConfirmationIfNeeded(latestInvoice, subscriptionId).catch(
          (error) => {
            console.error("[billing] failed to send client coaching payment confirmation", error);
          }
        );
      }
    }

    const paymentStartsInFuture = Boolean(
      paidStartRequest?.billingStartsAt && paidStartRequest.billingStartsAt > completedAt
    );
    if (!paymentStartsInFuture) {
      await sendCoachingPaymentReceivedNotification({
        clientName:
          `${application.applicantFirstName} ${application.applicantLastName}`.trim() ||
          application.applicantEmail,
        clientEmail: application.applicantEmail,
        tierLabel: coachingTiers.find((tier) => tier.id === offerKey)?.name || application.tier,
        applicationId: application.id,
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

    const membership = await startOrSwitchMembership({
      userId,
      plan,
      billingInterval,
      stripeSubscriptionId: subscription.id,
      stripePriceId,
      nextPeriodEnd: unixToDate(getStripeSubscriptionPeriodEnd(subscription)),
      disclosureVersion: session.metadata?.disclosureVersion || undefined,
      disclosureAcceptedAt: session.metadata?.disclosureAcceptedAt
        ? new Date(session.metadata.disclosureAcceptedAt)
        : undefined,
      complianceSnapshotJson: session.metadata?.complianceSnapshotJson
        ? JSON.parse(session.metadata.complianceSnapshotJson)
        : undefined,
      startedAt: session.created ? new Date(session.created * 1000) : new Date(),
    });

    const membershipUser = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, name: true },
    });

    if (membershipUser?.email && membership.trialEndsAt) {
      const immediateStartSummary =
        typeof session.metadata?.immediateStartSummary === "string"
          ? session.metadata.immediateStartSummary
          : null;

      await sendMembershipCheckoutConfirmationNotice({
        membershipId: membership.id,
        userId,
        email: membershipUser.email,
        firstName: membershipUser.firstName || membershipUser.name || "there",
        billingInterval,
        pricePence: membership.pricePence,
        trialEndsAt: membership.trialEndsAt,
        immediateStartSummary,
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

  const existingMembership = await db.membershipSubscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      trialEndsAt: true,
      latestInvoicePaidAt: true,
      billingInterval: true,
    },
  });

  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  await sendCoachingInvoiceConfirmationIfNeeded(invoice, subscriptionId).catch((error) => {
    console.error("[billing] failed to send client coaching invoice confirmation", error);
  });

  if ((invoice.amount_paid || 0) > 0) {
    const activation = await db.coachingClientProfile.updateMany({
      where: {
        stripeSubscriptionId: subscriptionId,
        billingArrangement: "pro_bono",
        billingStartsAt: { lte: new Date() },
      },
      data: { billingArrangement: "paid", billingStartsAt: null },
    });

    if (activation.count > 0) {
      const profile = await db.coachingClientProfile.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
        include: {
          user: { select: { email: true, firstName: true, lastName: true, name: true } },
          application: true,
          packageChangeRequests: {
            where: {
              requestType: "paid_start",
              stripeSubscriptionId: subscriptionId,
            },
            orderBy: { appliedAt: "desc" },
            take: 1,
          },
        },
      });
      if (profile?.application) {
        const clientName =
          profile.user.name ||
          `${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim() ||
          profile.user.email;
        await sendCoachingPaymentReceivedNotification({
          clientName,
          clientEmail: profile.user.email,
          tierLabel:
            coachingTiers.find((tier) => tier.id === profile.packageChangeRequests[0]?.toOfferKey)
              ?.name || profile.tier,
          applicationId: profile.application.id,
        });
      }
    }
  }

  const line = invoice.lines.data[0] as Stripe.InvoiceLineItem & {
    price?: { id?: string | null } | null;
  };
  const stripePriceId = line?.price?.id || null;
  const resolvedPlan = await resolvePlanFromStripePriceId(stripePriceId);
  if (!resolvedPlan) return;

  const updatedMembership = await startOrSwitchMembership({
    userId: user.id,
    plan: resolvedPlan.plan,
    billingInterval: resolvedPlan.billingInterval,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: stripePriceId || undefined,
    nextPeriodEnd: unixToDate(line?.period?.end),
  });

  const invoicePaidAt = new Date();
  const shouldOpenRenewalCoolingOff =
    Boolean(existingMembership?.trialEndsAt && !existingMembership.latestInvoicePaidAt) ||
    resolvedPlan.billingInterval === "annual";

  const membershipWithCoolingOff = shouldOpenRenewalCoolingOff
    ? await db.membershipSubscription.update({
        where: { id: updatedMembership.id },
        data: {
          latestInvoiceId: invoice.id,
          latestInvoiceAmountPence: invoice.amount_paid || 0,
          latestInvoicePaidAt: invoicePaidAt,
          renewalCoolingOffStartedAt: invoicePaidAt,
          renewalCoolingOffEndsAt: addDays(invoicePaidAt, 14),
          renewalCoolingOffKind:
            existingMembership?.trialEndsAt && !existingMembership.latestInvoicePaidAt
              ? "trial_conversion"
              : "annual_renewal",
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              name: true,
            },
          },
        },
      })
    : await db.membershipSubscription.update({
        where: { id: updatedMembership.id },
        data: {
          latestInvoiceId: invoice.id,
          latestInvoiceAmountPence: invoice.amount_paid || 0,
          latestInvoicePaidAt: invoicePaidAt,
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              name: true,
            },
          },
        },
      });

  await recoverMembershipDunningCase({
    userId: user.id,
    membershipId: updatedMembership.id,
    stripeInvoiceId: invoice.id || null,
  });

  if (
    shouldOpenRenewalCoolingOff &&
    membershipWithCoolingOff.user.email &&
    membershipWithCoolingOff.renewalCoolingOffEndsAt
  ) {
    await sendRenewalCoolingOffNotice({
      membershipId: membershipWithCoolingOff.id,
      userId: user.id,
      email: membershipWithCoolingOff.user.email,
      firstName:
        membershipWithCoolingOff.user.firstName || membershipWithCoolingOff.user.name || "there",
      renewalKind:
        membershipWithCoolingOff.renewalCoolingOffKind === "trial_conversion"
          ? "trial_conversion"
          : "annual_renewal",
      renewalDate: invoicePaidAt,
      coolingOffEndsAt: membershipWithCoolingOff.renewalCoolingOffEndsAt,
    });
  }

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
  await openMembershipDunningFromInvoice(invoice);
}

async function processCoachingSubscriptionUpdated(subscription: Stripe.Subscription) {
  const existingProfile = await db.coachingClientProfile.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true },
  });
  if (!existingProfile) return false;

  const cancelAt = subscription.cancel_at ? unixToDate(subscription.cancel_at) : null;
  const currentPeriodEnd = unixToDate(getStripeSubscriptionPeriodEnd(subscription));
  const isCancelled = subscription.status === "canceled";
  const cancellationPolicy = subscription.metadata?.cancellationPolicy;
  const metadataFinalPaymentAt = subscription.metadata?.coachingFinalPaymentAt
    ? new Date(subscription.metadata.coachingFinalPaymentAt)
    : null;
  const metadataEndsAt = subscription.metadata?.coachingEndsAt
    ? new Date(subscription.metadata.coachingEndsAt)
    : null;
  const cancellationRequestedAt = subscription.metadata?.cancellationRequestedAt
    ? new Date(subscription.metadata.cancellationRequestedAt)
    : null;
  const finalPaymentAt =
    cancellationPolicy === "end_current_period"
      ? null
      : metadataFinalPaymentAt && !Number.isNaN(metadataFinalPaymentAt.getTime())
        ? metadataFinalPaymentAt
        : cancelAt
          ? currentPeriodEnd
          : null;
  const billingEndsAt =
    metadataEndsAt && !Number.isNaN(metadataEndsAt.getTime()) ? metadataEndsAt : cancelAt;
  await db.coachingClientProfile.update({
    where: { id: existingProfile.id },
    data: {
      billingCancellationRequestedAt:
        cancellationRequestedAt && !Number.isNaN(cancellationRequestedAt.getTime())
          ? cancellationRequestedAt
          : undefined,
      billingFinalPaymentAt:
        cancellationPolicy === "end_current_period" ? null : finalPaymentAt || undefined,
      billingEndsAt: billingEndsAt || undefined,
      status: isCancelled ? "completed" : undefined,
      completedAt: isCancelled ? new Date() : undefined,
    },
  });

  await upsertCoachingSubscriptionProjection(subscription);

  return true;
}

async function processSubscriptionUpdated(subscription: Stripe.Subscription) {
  const handledCoaching = await processCoachingSubscriptionUpdated(subscription);
  if (handledCoaching) return;

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

async function linkStripeCustomerToUser(params: {
  userId: string;
  stripeCustomerId: string;
  stripeName?: string | null;
}) {
  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: { id: true, name: true, stripeCustomerId: true },
  });
  if (!user) return false;
  if (user.stripeCustomerId && user.stripeCustomerId !== params.stripeCustomerId) return false;

  const stripeName = params.stripeName?.trim() || "";
  await db.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: params.stripeCustomerId,
      ...(stripeName && !user.name ? { name: stripeName } : {}),
    },
  });
  return true;
}

async function processCustomerCreatedOrUpdated(customer: Stripe.Customer) {
  const stripeName = typeof customer.name === "string" ? customer.name : null;
  const existing = await db.user.findUnique({
    where: { stripeCustomerId: customer.id },
    select: { id: true, name: true },
  });

  if (existing) {
    if (stripeName?.trim() && !existing.name) {
      await db.user.update({
        where: { id: existing.id },
        data: { name: stripeName.trim() },
      });
    }
    return;
  }

  const metadataUserId =
    typeof customer.metadata?.userId === "string" ? customer.metadata.userId : null;
  if (metadataUserId) {
    const linked = await linkStripeCustomerToUser({
      userId: metadataUserId,
      stripeCustomerId: customer.id,
      stripeName,
    });
    if (linked) return;
  }

  const email = typeof customer.email === "string" ? customer.email.trim().toLowerCase() : "";
  if (!email) return;

  const userByEmail = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, stripeCustomerId: true },
  });
  if (!userByEmail || userByEmail.stripeCustomerId) return;

  await db.user.update({
    where: { id: userByEmail.id },
    data: {
      stripeCustomerId: customer.id,
      ...(stripeName?.trim() && !userByEmail.name ? { name: stripeName.trim() } : {}),
    },
  });
}

async function processCustomerDeleted(customer: Stripe.DeletedCustomer) {
  const user = await db.user.findUnique({
    where: { stripeCustomerId: customer.id },
    select: { id: true },
  });
  if (!user) return;

  await db.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: null },
  });
}

async function processPromotionCodeUpdated(promotionCode: Stripe.PromotionCode) {
  const promotionCoupon = promotionCode.promotion.coupon;
  if (!promotionCoupon) return;
  const coupon =
    typeof promotionCoupon === "string"
      ? await getStripeClient().coupons.retrieve(promotionCoupon)
      : promotionCoupon;
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

  if (event.type === "refund.updated" || event.type === "refund.failed") {
    await processRetreatRefundUpdated(event.data.object as Stripe.Refund);
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
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await processSubscriptionUpdated(event.data.object as Stripe.Subscription);
    return;
  }

  if (event.type === "customer.created" || event.type === "customer.updated") {
    await processCustomerCreatedOrUpdated(event.data.object as Stripe.Customer);
    return;
  }

  if (event.type === "customer.deleted") {
    await processCustomerDeleted(event.data.object as unknown as Stripe.DeletedCustomer);
    return;
  }

  if (event.type === "promotion_code.updated") {
    await processPromotionCodeUpdated(event.data.object as Stripe.PromotionCode);
    return;
  }

  if (
    event.type === "charge.dispute.created" ||
    event.type === "charge.dispute.updated" ||
    event.type === "charge.dispute.closed"
  ) {
    await processStripeDisputeEvent(event);
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

  if (
    event.type === "customer.created" ||
    event.type === "customer.updated" ||
    event.type === "customer.deleted"
  ) {
    const customer = event.data.object as Stripe.Customer | Stripe.DeletedCustomer;
    const user = await db.user.findUnique({
      where: { stripeCustomerId: customer.id },
      select: { id: true },
    });
    return user?.id || null;
  }

  if (event.type.startsWith("charge.dispute.")) {
    const dispute = event.data.object as Stripe.Dispute & {
      charge?: string | { customer?: string | { id?: string | null } | null } | null;
    };
    const charge = dispute.charge;
    const customerId =
      typeof charge === "string"
        ? null
        : typeof charge?.customer === "string"
          ? charge.customer
          : charge?.customer?.id || null;
    if (!customerId) return null;
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
