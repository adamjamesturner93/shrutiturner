import { BillingEventStatus, Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getBaseSiteUrlFromEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { assertPriceConfigured } from "@/lib/billing/price-map";
import { getActiveCatalogItem } from "@/lib/billing/catalog-service";
import { processStripeDisputeEvent } from "@/lib/billing/dispute-service";
import {
  computeReferralDiscountPence,
  consumeReferralDiscount,
} from "@/lib/referrals/referral-discount-service";
import { processGiftPurchaseCheckoutCompleted } from "@/lib/gifts/service";
import { processRetreatCheckoutCompleted } from "@/lib/retreats/service";
import { getNotificationInbox, sendPostmarkReactEmail } from "@/lib/postmark/client";
import { coachingTiers, type CoachingOfferKey } from "@/data/marketing";
import CoachingPaymentNotificationEmail from "@/emails/coaching-payment-notification";
import CoachingCancellationNotificationEmail from "@/emails/coaching-cancellation-notification";

const APP_URL = getBaseSiteUrlFromEnv();

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

  const [paidEvents, failedPaymentsCount] = await Promise.all([
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
  ]);

  const cashCollectedPence = paidEvents.reduce(
    (sum, event) => sum + extractPaidAmountPence(event.payloadJson, event.type),
    0
  );

  await db.billingMetricDaily.upsert({
    where: { date: from },
    create: {
      date: from,
      cashCollectedPence,
      failedPaymentsCount,
      activeMembersCount: 0,
      mrrPence: 0,
      churnedMembersCount: 0,
    },
    update: {
      cashCollectedPence,
      failedPaymentsCount,
      activeMembersCount: 0,
      mrrPence: 0,
      churnedMembersCount: 0,
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
    return_url: `${APP_URL}${options?.returnPath || "/dashboard/coaching"}`,
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

function coachingOfferToCatalogKey(offerKey: CoachingOfferKey) {
  return `coaching_${offerKey}_monthly` as const;
}

function getCoachingOfferFromAnswers(answers: Prisma.JsonValue) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return null;
  const offerKey = (answers as Record<string, unknown>).offerKey;
  return typeof offerKey === "string" && coachingTiers.some((tier) => tier.id === offerKey)
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
    subject: `1:1 payment received: ${input.clientName}`,
    react: CoachingPaymentNotificationEmail({
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      tierLabel: input.tierLabel,
      adminUrl,
    }),
    textBody: `1:1 payment received from ${input.clientName}\nEmail: ${input.clientEmail}\nTier: ${input.tierLabel}\n\nCreate or update the client manually in Everfit, then update their setup status in admin.\n\nAdmin: ${adminUrl}`,
    tag: "coaching-payment-received",
    templateKey: "coaching-payment-received",
    metadata: { applicationId: input.applicationId },
    dispatchMode: "immediate_best_effort",
  }).catch((error) => {
    console.error("[billing] failed to send coaching payment notification", error);
  });
}

async function sendCoachingCancellationNotification(input: {
  userId: string;
  nextPaymentAt: string;
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
  const nextPaymentLabel = formatEmailDateTime(input.nextPaymentAt);
  const endsAtLabel = formatEmailDateTime(input.endsAt);

  await sendPostmarkReactEmail({
    to: getNotificationInbox("COACHING_CANCELLATION_NOTIFICATION_EMAIL"),
    subject: `1:1 cancellation scheduled: ${clientName}`,
    react: CoachingCancellationNotificationEmail({
      clientName,
      clientEmail: user.email,
      nextPaymentAt: nextPaymentLabel,
      endsAt: endsAtLabel,
      adminUrl,
    }),
    textBody: `1:1 cancellation scheduled for ${clientName}\nEmail: ${user.email}\nFinal payment: ${nextPaymentLabel}\nBilling/access end: ${endsAtLabel}\n\nPlan the Everfit handover and access changes manually.\n\nAdmin: ${adminUrl}`,
    tag: "coaching-cancellation-scheduled",
    templateKey: "coaching-cancellation-scheduled",
    metadata: { userId: input.userId },
    dispatchMode: "immediate_best_effort",
  }).catch((error) => {
    console.error("[billing] failed to send coaching cancellation notification", error);
  });
}

export async function createCoachingCheckoutSession(
  userId: string,
  applicationId: string,
  options?: {
    successPath?: string;
    cancelPath?: string;
  }
) {
  const application = await db.coachingApplication.findFirst({
    where: {
      id: applicationId,
      userId,
      status: { in: ["approved", "converted"] },
    },
  });
  if (!application) throw new Error("COACHING_APPLICATION_NOT_APPROVED");

  const offerKey =
    getCoachingOfferFromAnswers(application.answersJson) || fallbackOfferForTier(application.tier);
  const catalog = await getActiveCatalogItem(coachingOfferToCatalogKey(offerKey));
  assertPriceConfigured(catalog.stripePriceId, `CATALOG_PRICE_COACHING_${offerKey}`);

  const [customerId, referralDiscountPence] = await Promise.all([
    getOrCreateStripeCustomer(userId),
    computeReferralDiscountPence(userId, catalog.unitAmountPence),
  ]);
  const coupon = await createOneTimeCouponIfNeeded(referralDiscountPence);
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    success_url: `${APP_URL}${options?.successPath || "/dashboard/coaching?checkout=success"}`,
    cancel_url: `${APP_URL}${options?.cancelPath || "/dashboard/coaching?checkout=cancelled"}`,
    line_items: [{ price: catalog.stripePriceId, quantity: 1 }],
    discounts: coupon ? [{ coupon: coupon.id }] : undefined,
    metadata: {
      userId,
      kind: "coaching",
      applicationId: application.id,
      offerKey,
      tier: application.tier,
      referralDiscountPence: referralDiscountPence > 0 ? String(referralDiscountPence) : "0",
      discountSource: referralDiscountPence > 0 ? "referral" : "none",
    },
  });

  if (!session.url) throw new Error("STRIPE_CHECKOUT_URL_MISSING");

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    discountPence: referralDiscountPence,
    discountSource: referralDiscountPence > 0 ? ("referral" as const) : ("none" as const),
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
  const offer = coachingTiers.find((tier) => tier.id === offerKey);
  if (!offer) throw new Error("INVALID_COACHING_OFFER");

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
        stripeSubscriptionId: updatedSubscription.id,
      },
    });
  });

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
): Promise<{
  checkoutUrl: string;
  sessionId: string;
  discountPence: number;
  discountSource: string;
}> {
  void userId;
  void bundleSize;
  void promotionCode;
  void options;
  throw new Error("CLASS_CREDITS_RETIRED");
}

export async function createMembershipCheckoutSession(
  userId: string,
  plan: "movewell",
  billingInterval: "monthly" | "annual",
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
): Promise<{
  checkoutUrl: string;
  sessionId: string;
  discountPence: number;
  discountSource: string;
}> {
  void userId;
  void plan;
  void billingInterval;
  void promotionCode;
  void offer;
  void options;
  throw new Error("MOVE_WELL_MEMBERSHIP_RETIRED");
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

async function processCheckoutCompleted(event: Stripe.Event, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const kind = session.metadata?.kind;
  const discountPence = Number(session.metadata?.referralDiscountPence || "0") || 0;
  const sourceRef = `stripe:checkout:${session.id}`;

  if (kind === "coaching") {
    const applicationId = session.metadata?.applicationId;
    const offerKey = session.metadata?.offerKey as CoachingOfferKey | undefined;
    if (!applicationId || !offerKey || !coachingTiers.some((tier) => tier.id === offerKey)) return;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription?.id ?? null);

    const application = await db.coachingApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application || application.userId !== userId) return;

    await db.$transaction(async (tx) => {
      await tx.coachingApplication.update({
        where: { id: application.id },
        data: {
          status: "converted",
          convertedAt: new Date(),
          approvedAt: application.approvedAt || new Date(),
        },
      });
      await tx.coachingClientProfile.upsert({
        where: { userId },
        create: {
          userId,
          applicationId: application.id,
          tier: application.tier === "unsure" ? "coaching" : application.tier,
          status: "onboarding",
          stripeSubscriptionId: subscriptionId,
          startDate: new Date(),
          nextCheckInDueAt: new Date(Date.now() + 7 * 86400000),
        },
        update: {
          applicationId: application.id,
          tier: application.tier === "unsure" ? "coaching" : application.tier,
          status: "onboarding",
          stripeSubscriptionId: subscriptionId,
          startDate: new Date(),
          nextCheckInDueAt: new Date(Date.now() + 7 * 86400000),
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { isCoachingClient: true },
      });
    });

    await sendCoachingPaymentReceivedNotification({
      clientName:
        `${application.applicantFirstName} ${application.applicantLastName}`.trim() ||
        application.applicantEmail,
      clientEmail: application.applicantEmail,
      tierLabel: coachingTiers.find((tier) => tier.id === offerKey)?.name || application.tier,
      applicationId: application.id,
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

  if (kind === "credits" || kind === "membership") return;
}

async function processInvoicePaid(event: Stripe.Event, invoice: Stripe.Invoice) {
  void event;
  void invoice;
}

async function processInvoicePaymentFailed(invoice: Stripe.Invoice) {
  void invoice;
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
  await db.coachingClientProfile.update({
    where: { id: existingProfile.id },
    data: {
      billingFinalPaymentAt: cancelAt ? currentPeriodEnd : undefined,
      billingEndsAt: cancelAt,
      status: isCancelled ? "completed" : undefined,
      completedAt: isCancelled ? new Date() : undefined,
    },
  });

  return true;
}

async function processSubscriptionUpdated(subscription: Stripe.Subscription) {
  const handledCoaching = await processCoachingSubscriptionUpdated(subscription);
  if (handledCoaching) return;
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
    await processCheckoutCompleted(event, session);
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
