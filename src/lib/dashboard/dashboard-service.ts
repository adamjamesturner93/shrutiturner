import { ClassBookingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getMembershipState } from "@/lib/membership/membership-service";
import type { DashboardSummaryDto } from "@/lib/api/types";

export async function getDashboardSummary(userId: string): Promise<DashboardSummaryDto> {
  const now = new Date();
  const weekStart = new Date(now);
  const day = weekStart.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  weekStart.setUTCDate(weekStart.getUTCDate() + diffToMonday);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const [
    membershipState,
    upcomingBookings,
    attendedCount,
    thisWeekBookedCount,
    historicalBookings,
    healthProfile,
  ] = await Promise.all([
    getMembershipState(userId),
    db.classBooking.findMany({
      where: {
        userId,
        status: ClassBookingStatus.booked,
        session: {
          startsAtUtc: { gte: now },
          status: { in: ["scheduled", "live"] },
        },
      },
      include: {
        session: true,
      },
      orderBy: {
        session: { startsAtUtc: "asc" },
      },
      take: 8,
    }),
    db.classBooking.count({
      where: { userId, status: ClassBookingStatus.attended },
    }),
    db.classBooking.count({
      where: {
        userId,
        status: ClassBookingStatus.booked,
        session: { startsAtUtc: { gte: weekStart, lt: weekEnd } },
      },
    }),
    db.classBooking.findMany({
      where: { userId, status: { in: [ClassBookingStatus.booked, ClassBookingStatus.attended] } },
      select: { sessionId: true },
    }),
    db.healthProfile.findUnique({
      where: { userId },
      select: { id: true },
    }),
  ]);

  const sessionFrequency = new Map<string, number>();
  for (const row of historicalBookings) {
    sessionFrequency.set(row.sessionId, (sessionFrequency.get(row.sessionId) || 0) + 1);
  }
  const favouriteSessionIds = Array.from(sessionFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sessionId]) => sessionId);
  const favouriteSessions = favouriteSessionIds.length
    ? await db.classSession.findMany({
        where: { id: { in: favouriteSessionIds } },
        select: {
          id: true,
          classDefinitionSlug: true,
          titleSnapshot: true,
          typeSnapshot: true,
          startsAtUtc: true,
        },
      })
    : [];
  const favouriteById = new Map(favouriteSessions.map((session) => [session.id, session]));

  return {
    hasHealthProfile: Boolean(healthProfile),
    upcomingClasses: upcomingBookings.map((booking) => ({
      bookingId: booking.id,
      sessionId: booking.sessionId,
      classSlug: booking.session.classDefinitionSlug,
      className: booking.session.titleSnapshot,
      classType: booking.session.typeSnapshot,
      startsAtUtc: booking.session.startsAtUtc.toISOString(),
      durationMinutes: booking.session.durationMinutes,
      entitlementType: booking.entitlementType,
    })),
    attendance: {
      attendedCount,
      thisWeekBookedCount,
    },
    favourites: favouriteSessionIds
      .map((sessionId) => favouriteById.get(sessionId))
      .filter(Boolean)
      .map((session) => ({
        classSlug: session!.classDefinitionSlug,
        className: session!.titleSnapshot,
        classType: session!.typeSnapshot,
        startsAtUtc: session!.startsAtUtc.toISOString(),
      })),
    membership: membershipState.membership,
    credits: membershipState.credits,
    referral: membershipState.referral,
  };
}
