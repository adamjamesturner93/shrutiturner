import { MembershipStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export type AdminBusinessSummary = {
  activeMembers: number;
  totalMembers: number;
  monthlyRecurringRevenuePence: number;
  newMembersThisMonth: number;
  cancelledLast30Days: number;
  churnRatePercent: number;
  failedPayments7d: number;
  failedPayments30d: number;
  dataFreshnessIso: string | null;
};

export async function getAdminBusinessSummary(): Promise<AdminBusinessSummary> {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [
    totalMembers,
    activeMembers,
    newMembersThisMonth,
    cancelledLast30Days,
    activeSubscriptions,
    failedPayments7d,
    failedPayments30d,
    latestBillingEvent,
    latestEmailEvent,
  ] = await Promise.all([
    db.user.count({ where: { role: { in: [UserRole.student, UserRole.member] } } }),
    db.membershipSubscription.count({
      where: { status: { in: [MembershipStatus.active, MembershipStatus.past_due] } },
    }),
    db.user.count({
      where: {
        role: { in: [UserRole.student, UserRole.member] },
        createdAt: { gte: startOfMonth },
      },
    }),
    db.membershipSubscription.count({
      where: {
        status: { in: [MembershipStatus.cancelled, MembershipStatus.expired] },
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
    db.membershipSubscription.findMany({
      where: {
        status: { in: [MembershipStatus.active, MembershipStatus.past_due] },
      },
      select: { pricePence: true },
    }),
    db.billingMetricDaily.aggregate({
      where: { date: { gte: sevenDaysAgo } },
      _sum: { failedPaymentsCount: true },
    }),
    db.billingMetricDaily.aggregate({
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { failedPaymentsCount: true },
    }),
    db.billingEvent.findFirst({
      orderBy: { processedAt: "desc" },
      select: { processedAt: true, createdAt: true },
    }),
    db.emailEvent.findFirst({
      orderBy: { eventAt: "desc" },
      select: { eventAt: true, createdAt: true },
    }),
  ]);

  const monthlyRecurringRevenuePence = activeSubscriptions.reduce(
    (sum, sub) => sum + sub.pricePence,
    0
  );
  const churnRatePercent =
    activeMembers > 0 ? Math.round((cancelledLast30Days / activeMembers) * 100) : 0;

  const freshnessCandidates = [
    latestBillingEvent?.processedAt || latestBillingEvent?.createdAt || null,
    latestEmailEvent?.eventAt || latestEmailEvent?.createdAt || null,
  ].filter(Boolean) as Date[];
  const dataFreshnessIso = freshnessCandidates.length
    ? new Date(Math.max(...freshnessCandidates.map((d) => d.getTime()))).toISOString()
    : null;

  return {
    activeMembers,
    totalMembers,
    monthlyRecurringRevenuePence,
    newMembersThisMonth,
    cancelledLast30Days,
    churnRatePercent,
    failedPayments7d: failedPayments7d._sum.failedPaymentsCount || 0,
    failedPayments30d: failedPayments30d._sum.failedPaymentsCount || 0,
    dataFreshnessIso,
  };
}
