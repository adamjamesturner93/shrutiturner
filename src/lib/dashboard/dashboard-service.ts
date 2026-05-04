import { ClassBookingStatus, ClassSessionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getMembershipState } from "@/lib/membership/membership-service";
import type { DashboardSummaryDto } from "@/lib/api/types";
import { needsHealthDeclarationReview } from "@/lib/health/health-service";

function getUtcWeekStart(date: Date) {
  const weekStart = new Date(date);
  const day = weekStart.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  weekStart.setUTCDate(weekStart.getUTCDate() + diffToMonday);
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}

function getUtcWeekStartKey(date: Date) {
  return getUtcWeekStart(date).toISOString().slice(0, 10);
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummaryDto> {
  const now = new Date();
  const weekStart = getUtcWeekStart(now);
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
      select: {
        status: true,
        session: {
          select: {
            id: true,
            classDefinitionSlug: true,
            titleSnapshot: true,
            typeSnapshot: true,
            startsAtUtc: true,
          },
        },
      },
    }),
    db.healthProfile.findUnique({
      where: { userId },
      select: {
        declarationStatus: true,
        lastConfirmedAt: true,
      },
    }),
  ]);

  const classFrequency = new Map<string, number>();
  const latestSessionByClass = new Map<string, (typeof historicalBookings)[number]["session"]>();
  const attendedWeekKeys = new Set<string>();
  let lastAttendedAt: Date | null = null;

  for (const row of historicalBookings) {
    const classSlug = row.session.classDefinitionSlug;
    classFrequency.set(classSlug, (classFrequency.get(classSlug) || 0) + 1);

    const latest = latestSessionByClass.get(classSlug);
    if (!latest || row.session.startsAtUtc > latest.startsAtUtc) {
      latestSessionByClass.set(classSlug, row.session);
    }

    if (row.status === ClassBookingStatus.attended) {
      attendedWeekKeys.add(getUtcWeekStartKey(row.session.startsAtUtc));
      if (!lastAttendedAt || row.session.startsAtUtc > lastAttendedAt) {
        lastAttendedAt = row.session.startsAtUtc;
      }
    }
  }

  let currentStreakWeeks = 0;
  for (
    let cursor = new Date(weekStart);
    attendedWeekKeys.has(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 7)
  ) {
    currentStreakWeeks += 1;
  }

  const favouriteClassSlugs = Array.from(classFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([classSlug]) => classSlug);
  const bookedUpcomingSessionIds = new Set(upcomingBookings.map((booking) => booking.sessionId));
  const suggestedClasses = favouriteClassSlugs.length
    ? await db.classSession.findMany({
        where: {
          classDefinitionSlug: { in: favouriteClassSlugs },
          id:
            bookedUpcomingSessionIds.size > 0
              ? { notIn: Array.from(bookedUpcomingSessionIds) }
              : undefined,
          status: { in: [ClassSessionStatus.scheduled, ClassSessionStatus.live] },
          startsAtUtc: { gte: now },
        },
        orderBy: { startsAtUtc: "asc" },
        take: 5,
      })
    : [];

  return {
    hasHealthProfile: Boolean(healthProfile),
    healthDeclarationStatus: healthProfile?.declarationStatus ?? "incomplete",
    healthDeclarationLastConfirmedAt: healthProfile?.lastConfirmedAt.toISOString() ?? "",
    healthDeclarationNeedsReview: needsHealthDeclarationReview(healthProfile?.lastConfirmedAt),
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
      currentStreakWeeks,
      lastAttendedAt: lastAttendedAt?.toISOString() ?? null,
    },
    favourites: favouriteClassSlugs
      .map((classSlug) => latestSessionByClass.get(classSlug))
      .filter(Boolean)
      .map((session) => ({
        classSlug: session!.classDefinitionSlug,
        className: session!.titleSnapshot,
        classType: session!.typeSnapshot,
        startsAtUtc: session!.startsAtUtc.toISOString(),
      })),
    suggestedClasses: suggestedClasses.map((session) => ({
      sessionId: session.id,
      classSlug: session.classDefinitionSlug,
      className: session.titleSnapshot,
      classType: session.typeSnapshot,
      startsAtUtc: session.startsAtUtc.toISOString(),
      durationMinutes: session.durationMinutes,
    })),
    membership: membershipState.membership,
    credits: membershipState.credits,
    referral: membershipState.referral,
  };
}
