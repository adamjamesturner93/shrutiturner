import {
  MembershipBillingInterval,
  MembershipPlan,
  MembershipStatus,
  Prisma,
} from "@prisma/client";
import type Stripe from "stripe";
import type { MembershipStateDto } from "@/lib/api/types";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { CREDIT_BUNDLE_CONFIG, MEMBERSHIP_CONFIG } from "@/lib/billing/price-map";
import { getActiveCatalogItem } from "@/lib/billing/catalog-service";
import {
  calculateProratedRefundAmount,
  getInitialComplianceWindow,
  getMembershipComplianceStatus,
  getSubscriptionComplianceHistory,
  issueMembershipRefund,
  recordSubscriptionComplianceEvent,
  sendMembershipCancellationNotice,
} from "@/lib/billing/subscription-compliance";
import { getCreditBalance, getCreditSummary } from "@/lib/credits/credit-service";
import { getReferralBalancePence } from "@/lib/referrals/referral-discount-service";

function getSubscriptionPeriodEnd(
  subscription: { current_period_end?: number | null } | Stripe.Subscription
) {
  return Number((subscription as { current_period_end?: number | null }).current_period_end || 0);
}

function getSubscriptionPeriodStart(
  subscription: { current_period_start?: number | null } | Stripe.Subscription
) {
  return Number(
    (subscription as { current_period_start?: number | null }).current_period_start || 0
  );
}

function unixToDate(value?: number | null) {
  return value ? new Date(value * 1000) : null;
}

function isAccessActiveStatus(status: MembershipStatus) {
  return (
    status === MembershipStatus.active ||
    status === MembershipStatus.paused ||
    status === MembershipStatus.past_due
  );
}

export function getMembershipLabel(plan: MembershipPlan | null) {
  if (!plan) return "Pay as you Go";
  if (plan === "instructor") return "Unlimited (instructor)";
  return "Move Well Membership";
}

export async function getCurrentMembership(userId: string) {
  return db.membershipSubscription.findFirst({
    where: {
      userId,
      status: { in: [MembershipStatus.active, MembershipStatus.paused, MembershipStatus.past_due] },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getLatestMembership(userId: string) {
  return db.membershipSubscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
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

function mapStripeStatus(status: string): MembershipStatus {
  if (status === "active" || status === "trialing") return MembershipStatus.active;
  if (status === "past_due" || status === "unpaid") return MembershipStatus.past_due;
  if (status === "canceled") return MembershipStatus.cancelled;
  if (status === "incomplete_expired") return MembershipStatus.expired;
  return MembershipStatus.paused;
}

async function upsertMembershipFromStripeSubscription(params: {
  userId: string;
  subscription: Stripe.Subscription;
  billingInterval: MembershipBillingInterval;
  plan: "movewell";
  priceId: string | null;
}) {
  const config = MEMBERSHIP_CONFIG[params.plan];
  const resolvedPricePence =
    params.billingInterval === "annual" ? config.annualPricePence : config.monthlyPricePence;
  const latestDb = await getLatestMembership(params.userId);
  const status = mapStripeStatus(params.subscription.status);
  const periodEnd = unixToDate(getSubscriptionPeriodEnd(params.subscription));
  const endsAt = params.subscription.cancel_at
    ? unixToDate(params.subscription.cancel_at)
    : status === MembershipStatus.cancelled || status === MembershipStatus.expired
      ? periodEnd
      : null;
  const membershipData = {
    plan: params.plan,
    billingInterval: params.billingInterval,
    status,
    pricePence: resolvedPricePence,
    classesPerWeek: config.classesPerWeek,
    renewsAt: periodEnd,
    endsAt,
    cancelAtPeriodEnd: Boolean(params.subscription.cancel_at_period_end),
    stripeSubscriptionId: params.subscription.id,
    stripePriceId: params.priceId || undefined,
    stripeCurrentPeriodEnd: periodEnd,
  };

  if (latestDb) {
    return db.membershipSubscription.update({
      where: { id: latestDb.id },
      data: membershipData,
    });
  }

  return db.membershipSubscription.create({
    data: {
      userId: params.userId,
      ...membershipData,
      currency: "GBP",
      classesUsedThisWeek: 0,
      startsAt: new Date(),
    },
  });
}

export async function syncMembershipFromStripe(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) return getLatestMembership(userId);

  const stripe = getStripeClient();
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    limit: 25,
  });

  const knownRaw = await Promise.all(
    subscriptions.data.map(async (subscription) => {
      const item = subscription.items.data[0];
      const priceId = item?.price?.id || null;
      const resolved = await resolvePlanFromStripePriceId(priceId);
      return resolved ? { subscription, ...resolved, priceId } : null;
    })
  );
  const known = knownRaw.filter(Boolean) as unknown as Array<{
    subscription: Stripe.Subscription;
    plan: "movewell";
    billingInterval: MembershipBillingInterval;
    priceId: string | null;
  }>;

  if (known.length === 0) {
    const latestDb = await getLatestMembership(userId);
    if (!latestDb) return null;

    if (latestDb.stripeSubscriptionId && isAccessActiveStatus(latestDb.status)) {
      return db.membershipSubscription.update({
        where: { id: latestDb.id },
        data: {
          status: MembershipStatus.cancelled,
          cancelAtPeriodEnd: false,
          endsAt: latestDb.renewsAt || latestDb.endsAt || new Date(),
        },
      });
    }

    return latestDb;
  }

  known.sort(
    (a, b) => getSubscriptionPeriodEnd(b.subscription) - getSubscriptionPeriodEnd(a.subscription)
  );
  const latest = known[0];
  return upsertMembershipFromStripeSubscription({
    userId,
    subscription: latest.subscription,
    billingInterval: latest.billingInterval,
    plan: latest.plan,
    priceId: latest.priceId,
  });
}

export async function getMembershipState(userId: string): Promise<MembershipStateDto> {
  const [subscription, creditBalance, creditSummary, referralBalancePence, complianceHistory] =
    await Promise.all([
      getLatestMembership(userId),
      getCreditBalance(userId),
      getCreditSummary(userId),
      getReferralBalancePence(userId),
      getSubscriptionComplianceHistory(userId),
    ]);

  const membership = subscription
    ? {
        id: subscription.id,
        plan: subscription.plan,
        billingInterval: subscription.billingInterval,
        isAnnual: subscription.billingInterval === "annual",
        status: subscription.status,
        label: getMembershipLabel(subscription.plan),
        renewalDate: subscription.renewsAt
          ? subscription.renewsAt.toISOString().slice(0, 10)
          : null,
        endsAt: subscription.endsAt ? subscription.endsAt.toISOString().slice(0, 10) : null,
        classesPerWeek: subscription.classesPerWeek,
        classesUsedThisWeek: subscription.classesUsedThisWeek,
        classesRemaining: Math.max(
          0,
          subscription.classesPerWeek - subscription.classesUsedThisWeek
        ),
        pricePence: subscription.pricePence,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        accessActive: isAccessActiveStatus(subscription.status),
        compliance: {
          disclosureVersion: subscription.disclosureVersion || null,
          disclosureAcceptedAt: subscription.disclosureAcceptedAt
            ? subscription.disclosureAcceptedAt.toISOString()
            : null,
          ...getMembershipComplianceStatus({
            membership: {
              trialEndsAt: subscription.trialEndsAt,
              initialCoolingOffEndsAt: subscription.initialCoolingOffEndsAt,
              renewalCoolingOffEndsAt: subscription.renewalCoolingOffEndsAt,
              renewalCoolingOffKind: subscription.renewalCoolingOffKind,
            },
          }),
        },
      }
    : null;

  return {
    membership,
    credits: {
      balance: creditBalance,
      summary: creditSummary,
    },
    referral: {
      balancePence: referralBalancePence,
    },
    complianceHistory,
  };
}

export async function ensureInstructorMembership(userId: string) {
  const existing = await getLatestMembership(userId);
  if (existing?.plan === "instructor") return existing;

  if (existing) {
    await db.membershipSubscription.update({
      where: { id: existing.id },
      data: {
        plan: "instructor",
        billingInterval: "monthly",
        status: MembershipStatus.active,
        pricePence: 0,
        classesPerWeek: 99,
        classesUsedThisWeek: 0,
        renewsAt: null,
        cancelAtPeriodEnd: false,
      },
    });
    return getCurrentMembership(userId);
  }

  await db.membershipSubscription.create({
    data: {
      userId,
      plan: "instructor",
      billingInterval: "monthly",
      status: MembershipStatus.active,
      pricePence: 0,
      currency: "GBP",
      classesPerWeek: 99,
      classesUsedThisWeek: 0,
      renewsAt: null,
      cancelAtPeriodEnd: false,
    },
  });

  return getCurrentMembership(userId);
}

export async function startOrSwitchMembership({
  userId,
  plan,
  billingInterval = "monthly",
  stripeSubscriptionId,
  stripePriceId,
  nextPeriodEnd,
  disclosureVersion,
  disclosureAcceptedAt,
  complianceSnapshotJson,
  startedAt,
}: {
  userId: string;
  plan: Exclude<MembershipPlan, "instructor">;
  billingInterval?: MembershipBillingInterval;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  nextPeriodEnd?: Date;
  disclosureVersion?: string;
  disclosureAcceptedAt?: Date;
  complianceSnapshotJson?: Prisma.InputJsonValue;
  startedAt?: Date;
}) {
  const config = MEMBERSHIP_CONFIG[plan];
  const catalogKey =
    billingInterval === "annual" ? "membership_movewell_annual" : "membership_movewell_monthly";
  const catalog = await getActiveCatalogItem(catalogKey);
  const existing = await getCurrentMembership(userId);
  const contractStart = startedAt || new Date();
  const fallbackPricePence =
    billingInterval === "annual" ? config.annualPricePence : config.monthlyPricePence;
  const complianceWindow =
    disclosureAcceptedAt || disclosureVersion ? getInitialComplianceWindow(contractStart) : null;

  const data: Prisma.MembershipSubscriptionUncheckedCreateInput = {
    userId,
    plan,
    billingInterval,
    status: MembershipStatus.active,
    pricePence: catalog.unitAmountPence || fallbackPricePence,
    currency: "GBP",
    classesPerWeek: config.classesPerWeek,
    classesUsedThisWeek: 0,
    startsAt: contractStart,
    renewsAt:
      nextPeriodEnd ||
      new Date(contractStart.getTime() + (billingInterval === "annual" ? 365 : 30) * 86400000),
    cancelAtPeriodEnd: false,
    stripeSubscriptionId,
    stripePriceId,
    stripeCurrentPeriodEnd: nextPeriodEnd,
    disclosureVersion,
    disclosureAcceptedAt,
    complianceSnapshotJson,
    trialEndsAt: complianceWindow?.trialEndsAt,
    initialCoolingOffEndsAt: complianceWindow?.initialCoolingOffEndsAt,
  };

  if (existing) {
    return db.membershipSubscription.update({
      where: { id: existing.id },
      data: {
        ...data,
      },
    });
  }

  return db.membershipSubscription.create({ data });
}

export async function changeMembershipPlan({
  userId,
  plan,
  billingInterval,
}: {
  userId: string;
  plan: Exclude<MembershipPlan, "instructor">;
  billingInterval: MembershipBillingInterval;
}) {
  const current = await getLatestMembership(userId);
  if (!current) throw new Error("MEMBERSHIP_NOT_FOUND");
  if (!isAccessActiveStatus(current.status)) throw new Error("MEMBERSHIP_NOT_ACTIVE");

  if (current.plan !== plan) {
    throw new Error("UNSUPPORTED_MEMBERSHIP_PLAN_CHANGE");
  }

  if (current.billingInterval === billingInterval) {
    return { membership: current, mode: "already_current" as const };
  }

  if (!current.stripeSubscriptionId) {
    throw new Error("STRIPE_SUBSCRIPTION_NOT_FOUND");
  }

  const catalogKey =
    billingInterval === "annual" ? "membership_movewell_annual" : "membership_movewell_monthly";
  const catalog = await getActiveCatalogItem(catalogKey);
  if (!catalog.stripePriceId) {
    throw new Error("STRIPE_PRICE_NOT_CONFIGURED");
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(current.stripeSubscriptionId);
  const subscriptionItem = subscription.items.data[0];
  if (!subscriptionItem?.id) {
    throw new Error("UNKNOWN_MEMBERSHIP_PRICE");
  }

  if (current.billingInterval === "monthly" && billingInterval === "annual") {
    const updated = await stripe.subscriptions.update(current.stripeSubscriptionId, {
      cancel_at_period_end: false,
      items: [
        {
          id: subscriptionItem.id,
          price: catalog.stripePriceId,
        },
      ],
      metadata: {
        plan,
        billingInterval,
        userId,
        changeMode: "immediate_prorated_upgrade",
      },
      proration_behavior: "create_prorations",
    });

    const membership = await upsertMembershipFromStripeSubscription({
      userId,
      subscription: updated,
      billingInterval,
      plan,
      priceId: catalog.stripePriceId,
    });

    return { membership, mode: "immediate" as const };
  }

  const currentPriceId = subscriptionItem.price?.id || current.stripePriceId;
  const currentPeriodStart = getSubscriptionPeriodStart(subscription);
  const currentPeriodEnd = getSubscriptionPeriodEnd(subscription);
  if (!currentPriceId || currentPeriodStart <= 0 || currentPeriodEnd <= 0) {
    throw new Error("UNKNOWN_MEMBERSHIP_PRICE");
  }

  const schedule = await stripe.subscriptionSchedules.create({
    from_subscription: current.stripeSubscriptionId,
  });

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: "release",
    phases: [
      {
        items: [
          {
            price: currentPriceId,
            quantity: subscriptionItem.quantity || 1,
          },
        ],
        start_date: currentPeriodStart,
        end_date: currentPeriodEnd,
      },
      {
        items: [
          {
            price: catalog.stripePriceId,
            quantity: subscriptionItem.quantity || 1,
          },
        ],
        start_date: currentPeriodEnd,
        metadata: {
          plan,
          billingInterval,
          userId,
          changeMode: "period_end_downgrade",
        },
      },
    ],
  });

  return { membership: current, mode: "period_end" as const };
}

export async function cancelMembership(
  userId: string,
  cancellation?: { reason?: string; reasonDetail?: string }
) {
  const current = await getLatestMembership(userId);
  if (!current) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, name: true },
  });
  const now = new Date();
  const compliance = getMembershipComplianceStatus({
    membership: {
      trialEndsAt: current.trialEndsAt,
      initialCoolingOffEndsAt: current.initialCoolingOffEndsAt,
      renewalCoolingOffEndsAt: current.renewalCoolingOffEndsAt,
      renewalCoolingOffKind: current.renewalCoolingOffKind,
    },
    now,
  });

  if (compliance.inInitialCoolingOff || compliance.inRenewalCoolingOff) {
    if (current.stripeSubscriptionId) {
      const stripe = getStripeClient();
      await stripe.subscriptions.cancel(current.stripeSubscriptionId);
    }

    let refundAmountPence = 0;
    if (
      compliance.inRenewalCoolingOff &&
      current.latestInvoiceAmountPence &&
      current.renewalCoolingOffStartedAt &&
      current.renewsAt
    ) {
      refundAmountPence = calculateProratedRefundAmount({
        paidAmountPence: current.latestInvoiceAmountPence,
        periodStart: current.renewalCoolingOffStartedAt,
        periodEnd: current.renewsAt,
        cancelledAt: now,
      });
      if (refundAmountPence > 0) {
        await issueMembershipRefund({
          membershipId: current.id,
          userId,
          amountPence: refundAmountPence,
          reason: "Renewal cooling-off cancellation",
        });
      }
    }

    const cancelled = await db.membershipSubscription.update({
      where: { id: current.id },
      data: {
        status: MembershipStatus.cancelled,
        cancelAtPeriodEnd: false,
        endsAt: now,
        renewsAt: null,
        renewalCoolingOffStartedAt: null,
        renewalCoolingOffEndsAt: null,
      },
    });

    await recordSubscriptionComplianceEvent({
      userId,
      membershipId: current.id,
      kind: "cooling_off_cancellation",
      status: "processed",
      summary: compliance.inInitialCoolingOff
        ? "Membership cancelled during the initial cooling-off period."
        : "Membership cancelled during the renewal cooling-off period.",
      metadataJson: {
        refundAmountPence,
        cancellationReason: cancellation?.reason || null,
        cancellationReasonDetail: cancellation?.reasonDetail || null,
      },
      eventAt: now,
    });

    if (user?.email) {
      await sendMembershipCancellationNotice({
        membershipId: current.id,
        userId,
        email: user.email,
        firstName: user.firstName || user.name || "there",
        endsAt: now,
        immediate: true,
        refundAmountPence,
      });
    }

    return cancelled;
  }

  if (current.stripeSubscriptionId) {
    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.update(current.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    const priceId = subscription.items.data[0]?.price?.id || null;
    const resolved = await resolvePlanFromStripePriceId(priceId);
    if (!resolved) throw new Error("UNKNOWN_MEMBERSHIP_PRICE");

    const updated = await upsertMembershipFromStripeSubscription({
      userId,
      subscription,
      billingInterval: resolved.billingInterval,
      plan: resolved.plan,
      priceId,
    });
    await recordSubscriptionComplianceEvent({
      userId,
      membershipId: current.id,
      kind: "membership_cancelled",
      status: "processed",
      summary: `Membership scheduled to end on ${updated.endsAt?.toISOString().slice(0, 10) || "the current period end"}.`,
      metadataJson: {
        cancellationReason: cancellation?.reason || null,
        cancellationReasonDetail: cancellation?.reasonDetail || null,
      },
      eventAt: now,
    });
    if (user?.email) {
      await sendMembershipCancellationNotice({
        membershipId: current.id,
        userId,
        email: user.email,
        firstName: user.firstName || user.name || "there",
        endsAt: updated.endsAt,
        immediate: false,
      });
    }
    return updated;
  }

  const updated = await db.membershipSubscription.update({
    where: { id: current.id },
    data: {
      cancelAtPeriodEnd: true,
      status:
        current.status === MembershipStatus.past_due
          ? MembershipStatus.past_due
          : MembershipStatus.active,
      endsAt: current.renewsAt || null,
    },
  });
  await recordSubscriptionComplianceEvent({
    userId,
    membershipId: current.id,
    kind: "membership_cancelled",
    status: "processed",
    summary: `Membership scheduled to end on ${updated.endsAt?.toISOString().slice(0, 10) || "the current period end"}.`,
    metadataJson: {
      cancellationReason: cancellation?.reason || null,
      cancellationReasonDetail: cancellation?.reasonDetail || null,
    },
    eventAt: now,
  });
  if (user?.email) {
    await sendMembershipCancellationNotice({
      membershipId: current.id,
      userId,
      email: user.email,
      firstName: user.firstName || user.name || "there",
      endsAt: updated.endsAt,
      immediate: false,
    });
  }
  return updated;
}

export async function resumeMembershipCancellation(userId: string) {
  const current = await getLatestMembership(userId);
  if (!current) throw new Error("MEMBERSHIP_NOT_FOUND");

  if (current.stripeSubscriptionId) {
    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.update(current.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    const priceId = subscription.items.data[0]?.price?.id || null;
    const resolved = await resolvePlanFromStripePriceId(priceId);
    if (!resolved) throw new Error("UNKNOWN_MEMBERSHIP_PRICE");

    return upsertMembershipFromStripeSubscription({
      userId,
      subscription,
      billingInterval: resolved.billingInterval,
      plan: resolved.plan,
      priceId,
    });
  }

  return db.membershipSubscription.update({
    where: { id: current.id },
    data: {
      cancelAtPeriodEnd: false,
      endsAt: null,
    },
  });
}

export function getCreditBundleConfig(bundleSize: number) {
  if (bundleSize === 1 || bundleSize === 3 || bundleSize === 10) {
    return CREDIT_BUNDLE_CONFIG[bundleSize];
  }
  throw new Error("INVALID_BUNDLE_SIZE");
}
