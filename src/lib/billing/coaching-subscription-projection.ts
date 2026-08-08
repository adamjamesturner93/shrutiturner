import "server-only";

import type Stripe from "stripe";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { db } from "@/lib/db";

function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id || null;
}

function subscriptionPeriod(
  subscription: Stripe.Subscription,
  field: "current_period_start" | "current_period_end"
) {
  const subscriptionValue = (subscription as Stripe.Subscription & Record<typeof field, number>)[
    field
  ];
  const itemValue = (
    subscription.items.data[0] as Stripe.SubscriptionItem & Record<typeof field, number>
  )?.[field];
  const value = subscriptionValue || itemValue;
  return value ? new Date(value * 1000) : null;
}

export async function upsertCoachingSubscriptionProjection(
  subscription: Stripe.Subscription,
  eventAt = new Date()
) {
  const profile = await db.coachingClientProfile.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true },
  });
  if (!profile) return false;

  const item = subscription.items.data[0];
  const recurring = item?.price?.recurring;
  if (!item?.price || !recurring?.interval) return false;

  const values = {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: stripeId(subscription.customer),
    stripePriceId: item.price.id,
    status: subscription.status,
    unitAmountPence: item.price.unit_amount || 0,
    quantity: item.quantity || 1,
    currency: item.price.currency.toUpperCase(),
    interval: recurring.interval,
    intervalCount: recurring.interval_count || 1,
    currentPeriodStart: subscriptionPeriod(subscription, "current_period_start"),
    currentPeriodEnd: subscriptionPeriod(subscription, "current_period_end"),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
    endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
    lastStripeEventAt: eventAt,
  };

  await db.coachingSubscriptionProjection.upsert({
    where: { coachingClientProfileId: profile.id },
    create: { coachingClientProfileId: profile.id, ...values },
    update: values,
  });
  return true;
}

export async function refreshCoachingSubscriptionProjections() {
  const profiles = await db.coachingClientProfile.findMany({
    where: { stripeSubscriptionId: { not: null } },
    select: {
      stripeSubscriptionId: true,
      subscriptionProjection: { select: { lastStripeEventAt: true } },
    },
  });
  const staleBefore = Date.now() - 15 * 60 * 1000;
  const stale = profiles.filter(
    (profile) =>
      profile.stripeSubscriptionId &&
      (!profile.subscriptionProjection ||
        profile.subscriptionProjection.lastStripeEventAt.getTime() < staleBefore)
  );
  if (stale.length === 0) return { refreshed: 0, failed: 0 };

  const stripe = getStripeClient();
  let refreshed = 0;
  let failed = 0;
  for (const profile of stale) {
    try {
      const subscription = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId!);
      if (await upsertCoachingSubscriptionProjection(subscription)) refreshed += 1;
    } catch (error) {
      failed += 1;
      console.error("[billing] failed to refresh coaching subscription projection", {
        subscriptionId: profile.stripeSubscriptionId,
        error,
      });
    }
  }
  return { refreshed, failed };
}

export function monthlyRecurringValuePence(input: {
  unitAmountPence: number;
  quantity: number;
  interval: string;
  intervalCount: number;
}) {
  const amount = input.unitAmountPence * input.quantity;
  const count = Math.max(input.intervalCount, 1);
  if (input.interval === "day") return Math.round((amount * 365) / (12 * count));
  if (input.interval === "week") return Math.round((amount * 52) / (12 * count));
  if (input.interval === "year") return Math.round(amount / (12 * count));
  return Math.round(amount / count);
}
