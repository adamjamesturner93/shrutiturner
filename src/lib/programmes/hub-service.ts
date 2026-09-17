import "server-only";
import { db } from "@/lib/db";
import { programmeNow } from "./clock";
import { eventClearanceState } from "@/lib/retreats/offering-clearance";
import { clearanceLabels } from "./policy";
import { getProgrammePortal, getProgrammeWeek } from "./content-service";
import { bookingSummary, consolidateActions, type HubAction } from "./hub-presentation";
import { getProgrammeCatalogue } from "./public-service";

function publishedImage(json: unknown) {
  if (!json || typeof json !== "object" || !("image" in json)) return null;
  const image = json.image;
  if (
    !image ||
    typeof image !== "object" ||
    !("url" in image) ||
    typeof image.url !== "string" ||
    !/^https:\/\//.test(image.url)
  )
    return null;
  return { url: image.url, alt: "alt" in image && typeof image.alt === "string" ? image.alt : "" };
}
export async function getClientHub(userId: string) {
  const now = programmeNow();
  const [user, coaching, enrolments, bookings, classes, membership, catalogue] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { firstName: true } }),
    db.coachingClientProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        nextCheckInDueAt: true,
        tier: true,
        checkIns: {
          where: { status: "due" },
          select: { id: true, dueAt: true },
          orderBy: { dueAt: "asc" },
          take: 3,
        },
      },
    }),
    db.smallGroupProgrammeEnrollment.findMany({
      where: { userId, paidAt: { not: null }, programme: { cohortState: { not: null } } },
      select: {
        programmeId: true,
        programme: { select: { publicImageUrl: true, publicImageAlt: true } },
      },
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
        purchaserUserId: true,
        attendeeUserId: true,
        attendeeCount: true,
        retreatDateId: true,
        attendees: { where: { userId }, select: { userId: true } },
        bookingStatus: true,
        paymentStatus: true,
        balanceAmountPence: true,
        balancePaidPence: true,
        balanceDueAt: true,
        instalments: { select: { status: true, dueAt: true, amountPence: true } },
        retreatDate: {
          select: {
            retreatTitleSnapshot: true,
            retreatLocationSnapshot: true,
            startsAt: true,
            endsAt: true,
            retreatType: true,
            eventKind: true,
            timezone: true,
            experience: { select: { publishedContentJson: true } },
          },
        },
      },
      orderBy: { retreatDate: { startsAt: "asc" } },
    }),
    db.classBooking.count({ where: { userId } }),
    db.membershipSubscription.count({ where: { userId } }),
    getProgrammeCatalogue(),
  ]);
  const programmes = await Promise.all(
    enrolments.map(async (row) => {
      const p = await getProgrammePortal(userId, row.programmeId);
      const week =
        p.accessible && p.currentWeek ? await getProgrammeWeek(userId, p.id, p.currentWeek) : null;
      return {
        ...p,
        image: row.programme.publicImageUrl,
        imageAlt: row.programme.publicImageAlt,
        currentTheme: week?.title || null,
        currentWeekNumber: week?.number || null,
        workoutStatus: week
          ? !week.canExercise
            ? "health_required"
            : week.canWorkout
              ? "ready"
              : week.availability
          : null,
      };
    })
  );
  const nav = [
    { label: "Dashboard", href: "/dashboard" },
    ...(coaching ? [{ label: "Coaching", href: "/dashboard/coaching" }] : []),
    ...(programmes.length ? [{ label: "Programmes", href: "/dashboard/programmes" }] : []),
    ...(bookings.length ? [{ label: "Events", href: "/dashboard/events" }] : []),
    { label: "Account", href: "/dashboard/account" },
  ];
  const actions: HubAction[] = [];
  for (const p of programmes.filter((p) => p.accessible)) {
    const groupId = `programme:${p.id}`;
    if (!p.canExercise)
      actions.push({
        id: `health:${p.id}`,
        groupId,
        title: p.title,
        detail: p.clearanceMessage,
        href: `/dashboard/programmes/${p.id}/onboarding`,
        label: "Complete onboarding",
        rank: p.clearanceStatus === "pending_confirmation" || !p.agreementsComplete ? 0 : 4,
        at: null,
        actionable: p.clearanceStatus === "pending_confirmation" || !p.agreementsComplete,
      });
    const session = p.sessions.find(
      (s) =>
        s.status === "scheduled" &&
        new Date(s.startsAt) >= now &&
        new Date(s.startsAt).getTime() <= now.getTime() + 7 * 86400000
    );
    if (session)
      actions.push({
        id: session.id,
        groupId,
        title: p.title,
        detail: session.title,
        href: `/dashboard/programmes/${p.id}/live`,
        label: "View session",
        rank: 2,
        at: session.startsAt,
        actionable: true,
        online: true,
        timezone: p.timezone,
      });
    if (p.currentWeek && p.state === "active")
      actions.push({
        id: `week:${p.id}`,
        groupId,
        title: p.title,
        detail: `Week ${p.currentWeekNumber} · ${p.currentTheme}`,
        href: `/dashboard/programmes/${p.id}/weeks/${p.currentWeek}`,
        label: "View this week",
        rank: 4,
        at: null,
        actionable: true,
      });
  }
  for (const checkIn of coaching?.checkIns || [])
    actions.push({
      id: checkIn.id,
      groupId: "coaching",
      title: "Your coaching check-in",
      detail: "Share how your training is going.",
      href: "/dashboard/coaching",
      label: "Open coaching",
      rank: 3,
      at: checkIn.dueAt.toISOString(),
      actionable: true,
    });
  const grouped = new Map<string, typeof bookings>();
  for (const b of bookings)
    grouped.set(b.retreatDateId, [...(grouped.get(b.retreatDateId) || []), b]);
  const events = await Promise.all(
    [...grouped.entries()].map(async ([id, rows]) => {
      const date = rows[0].retreatDate;
      const summaries = rows.map((b) => bookingSummary(b, userId, now));
      const active = summaries.filter((b) => b.active);
      const past = date.endsAt < now || !active.length;
      const participating = rows.find(
        (b) =>
          (b.attendeeUserId === userId || b.attendees.length) &&
          !["cancelled", "refunded"].includes(b.bookingStatus)
      );
      const readiness = participating && !past ? await eventClearanceState(userId, id) : null;
      const href = summaries.length === 1 ? summaries[0].href : `/dashboard/events/${id}`;
      const groupId = `event:${id}`;
      const base = {
        groupId,
        title: date.retreatTitleSnapshot,
        at: date.startsAt.toISOString(),
        timezone: date.timezone,
        online: date.retreatType === "online",
        location: date.retreatLocationSnapshot,
      };
      if (readiness?.required && !readiness.canExercise)
        actions.push({
          ...base,
          id: `event-health:${id}`,
          detail: clearanceLabels[readiness.status],
          href: `/dashboard/events/${participating!.id}/onboarding`,
          label: "Review health information",
          rank: readiness.status === "pending_confirmation" ? 0 : 4,
          actionable: readiness.status === "pending_confirmation",
        });
      const due = active.filter((b) => b.due);
      const outstanding = active.filter((b) => b.outstanding);
      if (!past && due.length)
        actions.push({
          ...base,
          id: `balance:${id}`,
          detail:
            due.length === 1
              ? "Your remaining balance is due."
              : `${due.length} bookings have a balance due.`,
          href: due.length === 1 ? `${due[0].href}#payment` : href,
          label: due.length === 1 ? "Pay balance" : "Manage bookings",
          rank: 1,
          actionable: true,
          secondaryHref: href,
          secondaryLabel: summaries.length === 1 ? "View booking" : "View bookings",
        });
      if (!past && date.startsAt >= now && date.startsAt.getTime() <= now.getTime() + 7 * 86400000)
        actions.push({
          ...base,
          id: `upcoming:${id}`,
          detail: "Your event is coming up.",
          href,
          label: summaries.length > 1 ? "Manage bookings" : "View booking",
          rank: 2,
          actionable: true,
        });
      const image = publishedImage(date.experience?.publishedContentJson);
      return {
        id,
        title: date.retreatTitleSnapshot,
        type:
          ["online_workshop", "in_person_workshop"].includes(date.eventKind) ||
          date.retreatType === "online"
            ? "Workshop"
            : "Retreat",
        startsAt: date.startsAt.toISOString(),
        endsAt: date.endsAt.toISOString(),
        timezone: date.timezone,
        online: date.retreatType === "online",
        location: date.retreatLocationSnapshot,
        image: image?.url || null,
        imageAlt: image?.alt || null,
        past,
        href,
        bookings: summaries,
        attendeeCount: active.reduce((sum, b) => sum + b.attendeeCount, 0),
        bookingCount: summaries.length,
        status: !active.length
          ? summaries[0].status
          : due.length
            ? "Balance due"
            : outstanding.length
              ? "Balance outstanding"
              : active.every((b) => b.status === "Paid in full")
                ? "Paid in full"
                : "Booking confirmed",
        balanceSummary: outstanding.length
          ? `${outstanding.length === 1 ? "One booking has" : `${outstanding.length} bookings have`} an outstanding balance.`
          : null,
        requiresConfirmation:
          readiness?.required &&
          !readiness.canExercise &&
          readiness.status === "pending_confirmation",
        onboardingHref: participating ? `/dashboard/events/${participating.id}/onboarding` : null,
      };
    })
  );
  return {
    firstName: user.firstName,
    nav,
    coaching: coaching
      ? {
          status: coaching.status,
          tier: coaching.tier,
          nextCheckInAt:
            coaching.nextCheckInDueAt?.toISOString() ||
            coaching.checkIns[0]?.dueAt.toISOString() ||
            null,
        }
      : null,
    programmes,
    events,
    actions: consolidateActions(actions),
    legacyClasses: classes > 0,
    legacyMembership: membership > 0,
    discovery: catalogue.programmes.slice(0, 1).map((p) => ({
      title: p.title,
      href: `/programmes/${p.slug}`,
      availability: p.availability,
    })),
  };
}
