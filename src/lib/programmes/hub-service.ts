import "server-only";
import { db } from "@/lib/db";
import { programmeNow } from "./clock";
import { eventClearanceState } from "@/lib/retreats/offering-clearance";
import { clearanceLabels } from "./policy";
import { getProgrammePortal } from "./content-service";

export async function getClientHub(userId: string) {
  const now = programmeNow();
  const [user, coaching, enrolments, events, classes, membership] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { firstName: true } }),
    db.coachingClientProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        checkIns: { where: { status: "due" }, select: { id: true, dueAt: true }, take: 3 },
      },
    }),
    db.smallGroupProgrammeEnrollment.findMany({
      where: { userId, paidAt: { not: null }, programme: { cohortState: { not: null } } },
      select: { programmeId: true },
      distinct: ["programmeId"],
    }),
    db.retreatBooking.findMany({
      where: {
        OR: [
          { purchaserUserId: userId },
          { attendeeUserId: userId },
          { attendees: { some: { userId } } },
        ],
        bookingStatus: { not: "pending" },
      },
      select: {
        id: true,
        attendeeUserId: true,
        retreatDateId: true,
        attendees: { where: { userId }, select: { userId: true } },
        bookingStatus: true,
        balanceAmountPence: true,
        balancePaidPence: true,
        retreatDate: {
          select: {
            retreatTitleSnapshot: true,
            startsAt: true,
            endsAt: true,
            retreatType: true,
            eventKind: true,
          },
        },
      },
      orderBy: { retreatDate: { startsAt: "asc" } },
    }),
    db.classBooking.count({ where: { userId } }),
    db.membershipSubscription.count({ where: { userId } }),
  ]);
  const programmes = await Promise.all(
    enrolments.map((row) => getProgrammePortal(userId, row.programmeId))
  );
  const nav = [
    { label: "Dashboard", href: "/dashboard" },
    ...(coaching ? [{ label: "Coaching", href: "/dashboard/coaching" }] : []),
    ...(programmes.length ? [{ label: "Programmes", href: "/dashboard/programmes" }] : []),
    ...(events.length ? [{ label: "Events", href: "/dashboard/events" }] : []),
    { label: "Account", href: "/dashboard/account" },
  ];
  const actions: {
    id: string;
    title: string;
    detail: string;
    href: string;
    rank: number;
    at: string | null;
    actionable: boolean;
  }[] = [];
  for (const p of programmes.filter((row) => row.accessible)) {
    if (!p.canExercise)
      actions.push({
        id: `health:${p.id}`,
        title: p.title,
        detail: p.clearanceMessage,
        href: `/dashboard/programmes/${p.id}/onboarding`,
        rank: 0,
        at: null,
        actionable: p.clearanceStatus === "pending_confirmation" || !p.agreementsComplete,
      });
    for (const s of p.sessions.filter(
      (row) =>
        row.status === "scheduled" &&
        new Date(row.startsAt) >= now &&
        new Date(row.startsAt).getTime() <= now.getTime() + 7 * 86400000
    ))
      actions.push({
        id: s.id,
        title: s.title,
        detail: p.title,
        href: `/dashboard/programmes/${p.id}/live`,
        rank: 1,
        at: s.startsAt,
        actionable: true,
      });
    if (p.currentWeek)
      actions.push({
        id: `week:${p.id}`,
        title: p.title,
        detail: "This week's education and workout",
        href: `/dashboard/programmes/${p.id}/weeks/${p.currentWeek}`,
        rank: 3,
        at: null,
        actionable: true,
      });
  }
  for (const checkIn of coaching?.checkIns || [])
    actions.push({
      id: checkIn.id,
      title: "Coaching check-in",
      detail: "Your next check-in is due",
      href: "/dashboard/coaching",
      rank: 2,
      at: checkIn.dueAt.toISOString(),
      actionable: true,
    });
  const eventReadiness = new Map<string, Awaited<ReturnType<typeof eventClearanceState>>>();
  for (const event of events) {
    if (
      (event.attendeeUserId === userId || event.attendees.length) &&
      !["cancelled", "refunded"].includes(event.bookingStatus) &&
      event.retreatDate.endsAt > now
    ) {
      const readiness = await eventClearanceState(userId, event.retreatDateId);
      eventReadiness.set(event.id, readiness);
      if (readiness.required && !readiness.canExercise)
        actions.push({
          id: `event-health:${event.id}`,
          title: event.retreatDate.retreatTitleSnapshot,
          detail: clearanceLabels[readiness.status],
          href: `/dashboard/events/${event.id}/onboarding`,
          rank: 0,
          at: null,
          actionable: readiness.status === "pending_confirmation",
        });
    }
    if (
      event.balanceAmountPence > event.balancePaidPence &&
      !["cancelled", "refunded"].includes(event.bookingStatus)
    )
      actions.push({
        id: `balance:${event.id}`,
        title: event.retreatDate.retreatTitleSnapshot,
        detail: "Review your remaining booking balance",
        href: `/dashboard/retreats/${event.id}`,
        rank: 0,
        at: null,
        actionable: true,
      });
    if (
      event.retreatDate.startsAt >= now &&
      event.retreatDate.startsAt.getTime() <= now.getTime() + 7 * 86400000
    )
      actions.push({
        id: event.id,
        title: event.retreatDate.retreatTitleSnapshot,
        detail: "Upcoming event",
        href: `/dashboard/retreats/${event.id}`,
        rank: 1,
        at: event.retreatDate.startsAt.toISOString(),
        actionable: true,
      });
  }
  return {
    firstName: user.firstName,
    nav,
    coaching: coaching ? { status: coaching.status } : null,
    programmes,
    events: events.map((e) => ({
      id: e.id,
      requiresConfirmation: eventReadiness.get(e.id)?.required || false,
      title: e.retreatDate.retreatTitleSnapshot,
      type:
        ["online_workshop", "in_person_workshop"].includes(e.retreatDate.eventKind) ||
        e.retreatDate.retreatType === "online"
          ? "Workshop"
          : "Retreat",
      startsAt: e.retreatDate.startsAt.toISOString(),
      past: e.retreatDate.endsAt < now,
      status: e.bookingStatus,
    })),
    actions: actions.sort((a, b) => a.rank - b.rank || (a.at || "").localeCompare(b.at || "")),
    legacyClasses: classes > 0,
    legacyMembership: membership > 0,
  };
}
