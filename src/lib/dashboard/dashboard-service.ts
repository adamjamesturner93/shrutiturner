import { ClassBookingStatus, ClassSessionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getMembershipState } from "@/lib/membership/membership-service";
import type { DashboardSummaryDto } from "@/lib/api/types";
import { needsHealthDeclarationReview } from "@/lib/health/health-service";
import { getMyCoachingState } from "@/lib/coaching/service";
import { getMyRetreatBookings } from "@/lib/retreats/service";
import { allCoachingTiers } from "@/data/marketing";

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
    coaching,
    retreats,
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
    getMyCoachingState(userId),
    getMyRetreatBookings(userId),
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

  const offer = coaching.application?.offerKey
    ? allCoachingTiers.find((tier) => tier.id === coaching.application?.offerKey)
    : null;
  const actions: DashboardSummaryDto["actions"] = [];
  if (!healthProfile) {
    actions.push({
      id: "health-profile",
      priority: "action",
      title: "Complete your health profile",
      detail: "Share the context Shruti needs before coaching or other movement services begin.",
      href: "/dashboard/health",
      ctaLabel: "Complete health profile",
      dueAt: null,
    });
  } else if (needsHealthDeclarationReview(healthProfile.lastConfirmedAt)) {
    actions.push({
      id: "health-review",
      priority: "action",
      title: "Review your health profile",
      detail: "Confirm that your health and movement context is still current.",
      href: "/dashboard/health",
      ctaLabel: "Review health profile",
      dueAt: null,
    });
  }
  if (coaching.application && ["approved", "offer_sent"].includes(coaching.application.status)) {
    actions.push({
      id: "coaching-recommendation",
      priority: "action",
      title: offer ? `Review ${offer.name}` : "Review your coaching recommendation",
      detail: offer
        ? `Shruti recommends ${offer.name} at ${offer.priceLabel}.`
        : "Your coaching recommendation is ready to review.",
      href: "/dashboard/coaching",
      ctaLabel: "Review and continue",
      dueAt: null,
    });
  }
  if (coaching.profile?.pendingPackageChange) {
    actions.push({
      id: "coaching-package-change",
      priority: "action",
      title:
        coaching.profile.pendingPackageChange.requestType === "paid_start"
          ? "Set up your coaching payment"
          : "Review your coaching package change",
      detail: "Shruti is waiting for you to confirm the next billing step.",
      href: "/dashboard/coaching",
      ctaLabel: "Review coaching update",
      dueAt: coaching.profile.pendingPackageChange.billingStartsAt,
    });
  }
  if (coaching.profile?.billingPhase === "payment_problem") {
    actions.push({
      id: "coaching-payment-problem",
      priority: "overdue",
      title: "Resolve your coaching payment",
      detail: "Your coaching subscription needs attention in Stripe.",
      href: "/dashboard/coaching",
      ctaLabel: "Review coaching billing",
      dueAt: null,
    });
  }
  if (membershipState.membership?.paymentIssue) {
    actions.push({
      id: "membership-payment",
      priority: "overdue",
      title: "Resolve your membership payment",
      detail: "Your membership payment needs attention to keep access active.",
      href: "/dashboard/membership",
      ctaLabel: "Review payment",
      dueAt: membershipState.membership.paymentIssue.graceEndsAt,
    });
  }
  for (const retreat of retreats.filter((booking) => booking.canPayBalance)) {
    const overdue = retreat.balanceDueAt
      ? new Date(retreat.balanceDueAt).getTime() < now.getTime()
      : false;
    actions.push({
      id: `retreat-balance-${retreat.id}`,
      priority: overdue ? "overdue" : "action",
      title: `Pay the balance for ${retreat.retreatTitle}`,
      detail: `Your remaining retreat balance is £${(retreat.balanceAmountPence / 100).toFixed(2)}.`,
      href: `/dashboard/retreats/${retreat.id}`,
      ctaLabel: "Review retreat payment",
      dueAt: retreat.balanceDueAt,
    });
  }

  const upcoming: DashboardSummaryDto["upcoming"] = [];
  if (coaching.profile?.nextBillingAt && coaching.profile.nextBillingAmountPence) {
    upcoming.push({
      id: "coaching-payment",
      kind: "coaching_payment",
      title:
        coaching.profile.billingPhase === "cancellation_scheduled"
          ? "Final coaching payment"
          : "Next coaching payment",
      detail: offer?.name || "Coaching",
      at: coaching.profile.nextBillingAt,
      amountPence: coaching.profile.nextBillingAmountPence,
      currency: coaching.profile.billingCurrency,
      href: "/dashboard/coaching",
    });
  }
  if (coaching.profile?.billingPhase === "final_month" && coaching.profile.billingEndsAt) {
    upcoming.push({
      id: "coaching-end",
      kind: "coaching_end",
      title: "Coaching access ends",
      detail: "Your current paid period is your final month.",
      at: coaching.profile.billingEndsAt,
      amountPence: null,
      currency: null,
      href: "/dashboard/coaching",
    });
  }
  for (const retreat of retreats) {
    if (retreat.canPayBalance && retreat.balanceDueAt) {
      upcoming.push({
        id: `retreat-payment-${retreat.id}`,
        kind: "retreat_balance",
        title: `${retreat.retreatTitle} balance due`,
        detail: retreat.location,
        at: retreat.balanceDueAt,
        amountPence: retreat.balanceAmountPence,
        currency: "GBP",
        href: `/dashboard/retreats/${retreat.id}`,
      });
    }
    if (new Date(retreat.startsAt).getTime() >= now.getTime()) {
      upcoming.push({
        id: `retreat-${retreat.id}`,
        kind: "retreat",
        title: retreat.retreatTitle,
        detail: retreat.location,
        at: retreat.startsAt,
        amountPence: null,
        currency: null,
        href: `/dashboard/retreats/${retreat.id}`,
      });
    }
  }
  for (const booking of upcomingBookings.slice(0, 3)) {
    upcoming.push({
      id: `class-${booking.sessionId}`,
      kind: "class",
      title: booking.session.titleSnapshot,
      detail: `${booking.session.durationMinutes} minute session`,
      at: booking.session.startsAtUtc.toISOString(),
      amountPence: null,
      currency: null,
      href: `/dashboard/schedule`,
    });
  }
  upcoming.sort((left, right) => left.at.localeCompare(right.at));

  const services: DashboardSummaryDto["services"] = [];
  if (coaching.application || coaching.profile) {
    const coachingStatus = coaching.profile
      ? coaching.profile.billingPhase === "final_month"
        ? "Final month"
        : coaching.profile.billingPhase === "cancellation_scheduled"
          ? "Cancellation scheduled"
          : coaching.profile.billingPhase === "payment_problem"
            ? "Payment needs attention"
            : offer?.name || coaching.state.replaceAll("_", " ")
      : offer?.name || coaching.state.replaceAll("_", " ");
    services.push({
      id: "coaching",
      title: "Coaching",
      status: coachingStatus,
      href: "/dashboard/coaching",
    });
  }
  if (retreats.length) {
    services.push({
      id: "retreats",
      title: "Retreats",
      status: `${retreats.length} booking${retreats.length === 1 ? "" : "s"}`,
      href: "/dashboard/retreats",
    });
  }
  if (upcomingBookings.length || attendedCount > 0) {
    services.push({
      id: "classes",
      title: "Classes",
      status: `${upcomingBookings.length} upcoming`,
      href: "/dashboard/schedule",
    });
  }
  if (membershipState.membership) {
    services.push({
      id: "membership",
      title: "Membership",
      status: membershipState.membership.label,
      href: "/dashboard/membership",
    });
  }

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
    actions: actions.sort((left, right) => {
      if (left.priority !== right.priority) return left.priority === "overdue" ? -1 : 1;
      return (left.dueAt || "9999").localeCompare(right.dueAt || "9999");
    }),
    upcoming,
    services,
  };
}
