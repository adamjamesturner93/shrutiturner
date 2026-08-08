import { db } from "@/lib/db";
import {
  monthlyRecurringValuePence,
  refreshCoachingSubscriptionProjections,
} from "@/lib/billing/coaching-subscription-projection";
import type { AdminBusinessMetricDto } from "@/lib/api/types";

export type AdminBusinessSummary = AdminBusinessMetricDto;

export async function getAdminBusinessSummary(): Promise<AdminBusinessSummary> {
  const projectionRefresh = await refreshCoachingSubscriptionProjections().catch(() => ({
    refreshed: 0,
    failed: 1,
  }));
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [
    operationalOneToOneClients,
    activeOneToOneClients,
    newPaidClientsThisMonth,
    activeSubscriptions,
    failedPayments7d,
    failedPayments30d,
    latestProjection,
    profilesWithoutProjection,
  ] = await Promise.all([
    db.coachingClientProfile.count({
      where: { status: { in: ["onboarding", "active", "paused"] } },
    }),
    db.coachingSubscriptionProjection.count({
      where: { status: { in: ["active", "trialing", "past_due"] } },
    }),
    db.coachingSubscriptionProjection.count({
      where: {
        createdAt: { gte: startOfMonth },
        status: { in: ["active", "trialing", "past_due"] },
      },
    }),
    db.coachingSubscriptionProjection.findMany({
      where: { status: { in: ["active", "trialing", "past_due"] } },
      select: {
        unitAmountPence: true,
        quantity: true,
        interval: true,
        intervalCount: true,
        cancelAt: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
      },
    }),
    db.billingMetricDaily.aggregate({
      where: { date: { gte: sevenDaysAgo } },
      _sum: { failedPaymentsCount: true },
    }),
    db.billingMetricDaily.aggregate({
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { failedPaymentsCount: true },
    }),
    db.coachingSubscriptionProjection.findFirst({
      orderBy: { lastStripeEventAt: "desc" },
      select: { lastStripeEventAt: true },
    }),
    db.coachingClientProfile.count({
      where: { stripeSubscriptionId: { not: null }, subscriptionProjection: null },
    }),
  ]);

  const monthlyRecurringRevenuePence = activeSubscriptions.reduce(
    (sum, subscription) => sum + monthlyRecurringValuePence(subscription),
    0
  );
  const endingSoonCount = activeSubscriptions.filter((subscription) => {
    const end =
      subscription.cancelAt ||
      (subscription.cancelAtPeriodEnd ? subscription.currentPeriodEnd : null);
    return end && end >= now && end <= new Date(now.getTime() + 30 * 86400000);
  }).length;

  return {
    activeOneToOneClients,
    operationalOneToOneClients,
    trackedSubscriptions: activeSubscriptions.length,
    subscriptionsNeedingSync: profilesWithoutProjection + projectionRefresh.failed,
    monthlyRecurringRevenuePence,
    newPaidClientsThisMonth,
    endingSoonCount,
    failedPayments7d: failedPayments7d._sum.failedPaymentsCount || 0,
    failedPayments30d: failedPayments30d._sum.failedPaymentsCount || 0,
    dataFreshnessIso: latestProjection?.lastStripeEventAt.toISOString() || null,
  };
}
