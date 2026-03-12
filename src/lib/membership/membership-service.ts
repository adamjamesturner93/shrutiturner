import {
  MembershipBillingInterval,
  MembershipPlan,
  MembershipStatus,
  Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { CREDIT_BUNDLE_CONFIG, MEMBERSHIP_CONFIG } from "@/lib/billing/price-map";
import { getActiveCatalogItem } from "@/lib/billing/catalog-service";
import { getCreditBalance, getCreditSummary } from "@/lib/credits/credit-service";
import { getReferralBalancePence } from "@/lib/referrals/referral-discount-service";

export function getMembershipLabel(plan: MembershipPlan | null) {
  if (!plan) return "No plan";
  if (plan === "instructor") return "Unlimited (instructor)";
  if (plan === "movewell") return "Move Well Membership";
  return MEMBERSHIP_CONFIG[plan].label;
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

async function resolvePlanFromStripePriceId(stripePriceId?: string | null):
  | { plan: "movewell"; billingInterval: MembershipBillingInterval }
  | null {
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

export async function syncMembershipFromStripe(userId: string) {
  const existingCurrent = await getCurrentMembership(userId);
  if (existingCurrent) return existingCurrent;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) return null;

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
  const known = knownRaw.filter(Boolean) as Array<{
    subscription: { id: string; status: string; current_period_end: number; cancel_at_period_end: boolean };
    plan: "movewell";
    billingInterval: MembershipBillingInterval;
    priceId: string | null;
  }>;

  if (known.length === 0) return null;

  known.sort(
    (a, b) =>
      Number(b.subscription.current_period_end || 0) - Number(a.subscription.current_period_end || 0)
  );
  const latest = known[0];
  const config = MEMBERSHIP_CONFIG[latest.plan];
  const resolvedPricePence =
    latest.billingInterval === "annual" ? config.annualPricePence : config.monthlyPricePence;

  const latestDb = await db.membershipSubscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const membershipData = {
    plan: latest.plan,
    billingInterval: latest.billingInterval,
    status: mapStripeStatus(latest.subscription.status),
    pricePence: resolvedPricePence,
    classesPerWeek: config.classesPerWeek,
    renewsAt: new Date(latest.subscription.current_period_end * 1000),
    cancelAtPeriodEnd: Boolean(latest.subscription.cancel_at_period_end),
    stripeSubscriptionId: latest.subscription.id,
    stripePriceId: latest.priceId || undefined,
    stripeCurrentPeriodEnd: new Date(latest.subscription.current_period_end * 1000),
  };

  const upserted = latestDb
    ? await db.membershipSubscription.update({
        where: { id: latestDb.id },
        data: membershipData,
      })
    : await db.membershipSubscription.create({
        data: {
          userId,
          ...membershipData,
          currency: "GBP",
          classesUsedThisWeek: 0,
          startsAt: new Date(),
        },
      });

  return upserted;
}

export async function getMembershipState(userId: string) {
  const [subscription, creditBalance, creditSummary, referralBalancePence] = await Promise.all([
    getCurrentMembership(userId),
    getCreditBalance(userId),
    getCreditSummary(userId),
    getReferralBalancePence(userId),
  ]);

  const membership = subscription
    ? {
        id: subscription.id,
        plan: subscription.plan,
        billingInterval: subscription.billingInterval,
        isAnnual: subscription.billingInterval === "annual",
        status: subscription.status,
        label: getMembershipLabel(subscription.plan),
        renewalDate: subscription.renewsAt ? subscription.renewsAt.toISOString().slice(0, 10) : null,
        classesPerWeek: subscription.classesPerWeek,
        classesUsedThisWeek: subscription.classesUsedThisWeek,
        classesRemaining: Math.max(0, subscription.classesPerWeek - subscription.classesUsedThisWeek),
        pricePence: subscription.pricePence,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
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
  };
}

export async function ensureInstructorMembership(userId: string) {
  const existing = await getCurrentMembership(userId);
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
}: {
  userId: string;
  plan: Exclude<MembershipPlan, "instructor">;
  billingInterval?: MembershipBillingInterval;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  nextPeriodEnd?: Date;
}) {
  const config = MEMBERSHIP_CONFIG[plan];
  const catalogKey =
    billingInterval === "annual" ? "membership_movewell_annual" : "membership_movewell_monthly";
  const catalog = await getActiveCatalogItem(catalogKey);
  const existing = await getCurrentMembership(userId);
  const fallbackPricePence =
    billingInterval === "annual" ? config.annualPricePence : config.monthlyPricePence;

  const data: Prisma.MembershipSubscriptionUncheckedCreateInput = {
    userId,
    plan,
    billingInterval,
    status: MembershipStatus.active,
    pricePence: catalog.unitAmountPence || fallbackPricePence,
    currency: "GBP",
    classesPerWeek: config.classesPerWeek,
    classesUsedThisWeek: 0,
    startsAt: new Date(),
    renewsAt: nextPeriodEnd || new Date(Date.now() + (billingInterval === "annual" ? 365 : 30) * 86400000),
    cancelAtPeriodEnd: false,
    stripeSubscriptionId,
    stripePriceId,
    stripeCurrentPeriodEnd: nextPeriodEnd,
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

export async function cancelMembership(userId: string) {
  const current = await getCurrentMembership(userId);
  if (!current) return null;

  return db.membershipSubscription.update({
    where: { id: current.id },
    data: {
      cancelAtPeriodEnd: true,
      status: current.status === MembershipStatus.past_due ? MembershipStatus.past_due : MembershipStatus.active,
      endsAt: current.renewsAt || null,
    },
  });
}

export function getCreditBundleConfig(bundleSize: number) {
  if (bundleSize === 1 || bundleSize === 3 || bundleSize === 10) {
    return CREDIT_BUNDLE_CONFIG[bundleSize];
  }
  throw new Error("INVALID_BUNDLE_SIZE");
}
