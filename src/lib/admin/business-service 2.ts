import { MembershipStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export type AdminBusinessSummary = {
  activeMembers: number;
  totalMembers: number;
  monthlyRecurringRevenuePence: number;
  newMembersThisMonth: number;
  cancelledLast30Days: number;
  churnRatePercent: number;
};

export async function getAdminBusinessSummary(): Promise<AdminBusinessSummary> {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [totalMembers, activeMembers, newMembersThisMonth, cancelledLast30Days, activeSubscriptions] =
    await Promise.all([
      db.user.count({ where: { role: UserRole.student } }),
      db.membershipSubscription.count({
        where: { status: { in: [MembershipStatus.active, MembershipStatus.past_due] } },
      }),
      db.user.count({
        where: {
          role: UserRole.student,
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
    ]);

  const monthlyRecurringRevenuePence = activeSubscriptions.reduce(
    (sum, sub) => sum + sub.pricePence,
    0
  );
  const churnRatePercent = activeMembers > 0 ? Math.round((cancelledLast30Days / activeMembers) * 100) : 0;

  return {
    activeMembers,
    totalMembers,
    monthlyRecurringRevenuePence,
    newMembersThisMonth,
    cancelledLast30Days,
    churnRatePercent,
  };
}
