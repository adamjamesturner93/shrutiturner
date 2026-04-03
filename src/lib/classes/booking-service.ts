import {
  BookingEntitlementType,
  ClassBookingStatus,
  ClassSessionStatus,
  ClassWaitlistStatus,
  MembershipStatus,
  Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";
import {
  sendBookingConfirmation,
  sendClassCancellation,
  sendClassUnbooking,
  sendClassReminder,
  sendInstructorNotification,
} from "@/lib/email";
import { getFirstWaiting, joinWaitlist, removeFromWaitlist } from "@/lib/classes/waitlist-service";
import type { BookSessionResultDto } from "@/lib/classes/types";
import {
  consumeOneCreditForBooking,
  refundOneCreditForBooking,
} from "@/lib/credits/credit-service";
import type { DateFormatPreference } from "@/lib/date-i18n";
import {
  getClassOperationalSettings,
  isInsideEmptyClassAutoCancelWindow,
  shouldRefundCreditForCancellation,
} from "@/lib/classes/settings-service";
import { setUpSessionRoom, tearDownSessionRoom } from "@/lib/classes/session-service";
import { getHealthAccessState } from "@/lib/health/health-service";
const DATE_FORMAT_PREFERENCES: DateFormatPreference[] = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

function toDateFormatPreference(value: string | null | undefined): DateFormatPreference {
  return DATE_FORMAT_PREFERENCES.includes(value as DateFormatPreference)
    ? (value as DateFormatPreference)
    : "DD/MM/YYYY";
}

async function logEvent(
  sessionId: string,
  type:
    | "booking_created"
    | "booking_cancelled"
    | "waitlist_joined"
    | "waitlist_promoted"
    | "session_cancelled",
  message?: string,
  payload?: Record<string, unknown>
) {
  await db.classSessionEvent.create({
    data: {
      sessionId,
      type,
      message,
      payload: (payload as Prisma.InputJsonValue | undefined) || undefined,
    },
  });
}

function getUtcWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setUTCDate(start.getUTCDate() + diffToMonday);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

async function getActiveBookedCount(
  sessionId: string,
  tx: Prisma.TransactionClient | typeof db = db
) {
  return tx.classBooking.count({
    where: {
      sessionId,
      status: ClassBookingStatus.booked,
    },
  });
}

async function getMembershipWeeklyUsage(
  userId: string,
  now: Date,
  tx: Prisma.TransactionClient | typeof db = db
) {
  const weekStart = getUtcWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const count = await tx.classBooking.count({
    where: {
      userId,
      status: ClassBookingStatus.booked,
      entitlementType: BookingEntitlementType.membership,
      session: {
        startsAtUtc: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    },
  });

  return { weekStart, weekEnd, used: count };
}

async function getBookableMembership(
  userId: string,
  tx: Prisma.TransactionClient | typeof db = db
) {
  return tx.membershipSubscription.findFirst({
    where: {
      userId,
      status: {
        in: [MembershipStatus.active, MembershipStatus.past_due],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function decideEntitlement(
  userId: string,
  now: Date,
  tx: Prisma.TransactionClient | typeof db = db
) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "admin") {
    return {
      entitlementType: BookingEntitlementType.manual,
      membershipId: null,
      weeklyUsage: 0,
    } as const;
  }

  const membership = await getBookableMembership(userId, tx);
  if (membership && membership.classesPerWeek >= 99) {
    return {
      entitlementType: BookingEntitlementType.membership,
      membershipId: membership.id,
      weeklyUsage: membership.classesUsedThisWeek,
    } as const;
  }

  if (membership) {
    const usage = await getMembershipWeeklyUsage(userId, now, tx);
    if (usage.used < membership.classesPerWeek) {
      return {
        entitlementType: BookingEntitlementType.membership,
        membershipId: membership.id,
        weeklyUsage: usage.used,
      } as const;
    }
  }

  const creditAggregate = await tx.creditLedgerEntry.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  const creditBalance = creditAggregate._sum.amount || 0;
  if (creditBalance > 0) {
    return {
      entitlementType: BookingEntitlementType.credit,
      membershipId: null,
      weeklyUsage: 0,
    } as const;
  }

  throw new Error("BOOKING_LIMIT_REACHED");
}

async function claimFirstSignupInstructorNotification(sessionId: string) {
  const result = await db.classSession.updateMany({
    where: {
      id: sessionId,
      firstSignupInstructorEmailSentAt: null,
      status: {
        in: [ClassSessionStatus.scheduled, ClassSessionStatus.live],
      },
    },
    data: {
      firstSignupInstructorEmailSentAt: new Date(),
    },
  });

  return result.count > 0;
}

async function resetFirstSignupInstructorNotification(sessionId: string) {
  await db.classSession.update({
    where: { id: sessionId },
    data: {
      firstSignupInstructorEmailSentAt: null,
    },
  });
}

async function notifyInstructorOfFirstSignup(sessionId: string, attendeeUserId: string) {
  const claimed = await claimFirstSignupInstructorNotification(sessionId);
  if (!claimed) {
    return;
  }

  const [session, attendee, attendeeCount] = await Promise.all([
    db.classSession.findUnique({
      where: { id: sessionId },
      include: {
        instructor: {
          select: {
            email: true,
          },
        },
      },
    }),
    db.user.findUnique({
      where: { id: attendeeUserId },
      select: {
        firstName: true,
        lastName: true,
        name: true,
        email: true,
      },
    }),
    getActiveBookedCount(sessionId),
  ]);

  if (!session?.instructor.email || !attendee) {
    return;
  }

  const attendeeName =
    [attendee.firstName, attendee.lastName].filter(Boolean).join(" ").trim() ||
    attendee.name ||
    attendee.email;

  void sendInstructorNotification(
    session.instructor.email,
    "first-signup",
    session.titleSnapshot,
    session.startsAtUtc.toISOString(),
    session.startsAtUtc.toISOString(),
    attendeeName,
    attendeeCount,
    session.startsAtUtc,
    session.durationMinutes
  );
}

async function handleFirstBookedAttendee(sessionId: string, attendeeUserId: string) {
  const results = await Promise.allSettled([
    setUpSessionRoom(sessionId),
    notifyInstructorOfFirstSignup(sessionId, attendeeUserId),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to process first booked attendee side effects", result.reason);
    }
  }
}

async function autoCancelClassSessionForNoAttendance(sessionId: string, now = new Date()) {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    include: {
      instructor: {
        select: {
          email: true,
        },
      },
      waitlist: {
        where: {
          status: ClassWaitlistStatus.waiting,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("SESSION_NOT_FOUND");
  }

  if (session.status === ClassSessionStatus.cancelled) {
    return { alreadyCancelled: true };
  }

  const activeBookedCount = await getActiveBookedCount(sessionId);
  if (activeBookedCount > 0) {
    return { alreadyCancelled: false, skipped: true };
  }

  await db.$transaction(async (tx) => {
    await tx.classSession.update({
      where: { id: sessionId },
      data: {
        status: ClassSessionStatus.cancelled,
        cancelledAt: now,
        cancelReason:
          "Automatically cancelled because nobody was booked in three hours before class.",
        autoCancelledForNoAttendanceAt: now,
        reminderProcessedAt: now,
      },
    });

    await tx.classWaitlistEntry.updateMany({
      where: {
        sessionId,
        status: ClassWaitlistStatus.waiting,
      },
      data: {
        status: ClassWaitlistStatus.removed,
      },
    });
  });

  await logEvent(sessionId, "session_cancelled", "Session auto-cancelled due to no attendees", {
    reason: "no_attendance_three_hour_cutoff",
  });

  if (session.instructor.email) {
    void sendInstructorNotification(
      session.instructor.email,
      "no-attendance-cancelled",
      session.titleSnapshot,
      session.startsAtUtc.toISOString(),
      session.startsAtUtc.toISOString(),
      "No attendees",
      0,
      session.startsAtUtc,
      session.durationMinutes
    );
  }

  const roomTeardown = await tearDownSessionRoom(sessionId).catch((error) => ({
    status: "failed" as const,
    message: error instanceof Error ? error.message : "Failed to close Daily room",
  }));
  if (roomTeardown.status === "failed") {
    console.error("Failed to tear down Daily room for auto-cancelled session", roomTeardown.message);
  }

  return { alreadyCancelled: false, removedWaitlist: session.waitlist.length };
}

async function promoteFirstWaitlisted(sessionId: string) {
  const waiting = await getFirstWaiting(sessionId);
  if (!waiting) return null;

  const bookedCountBeforePromotion = await getActiveBookedCount(sessionId);

  const promotedBooking = await db.$transaction(async (tx) => {
    const row = await tx.classWaitlistEntry.findUnique({ where: { id: waiting.id } });
    if (!row || row.status !== ClassWaitlistStatus.waiting) {
      return null;
    }

    let entitlement: {
      entitlementType: BookingEntitlementType;
      membershipId: string | null;
      weeklyUsage: number;
    } | null = null;
    try {
      entitlement = await decideEntitlement(waiting.userId, new Date(), tx);
    } catch {
      return null;
    }

    const bookingRef = `class_booking_waitlist:${sessionId}:${waiting.userId}:${new Date().toISOString()}`;
    const creditLedger =
      entitlement.entitlementType === BookingEntitlementType.credit
        ? await consumeOneCreditForBooking({ userId: waiting.userId, bookingRef, tx })
        : null;

    await tx.classWaitlistEntry.update({
      where: { id: waiting.id },
      data: {
        status: ClassWaitlistStatus.promoted,
        promotedAt: new Date(),
      },
    });

    const booking = await tx.classBooking.upsert({
      where: { sessionId_userId: { sessionId, userId: waiting.userId } },
      create: {
        sessionId,
        userId: waiting.userId,
        status: ClassBookingStatus.booked,
        entitlementType: entitlement.entitlementType,
        creditLedgerEntryId: creditLedger?.id || null,
      },
      update: {
        status: ClassBookingStatus.booked,
        cancelledAt: null,
        entitlementType: entitlement.entitlementType,
        creditLedgerEntryId: creditLedger?.id || null,
      },
    });

    if (entitlement.membershipId) {
      await tx.membershipSubscription.update({
        where: { id: entitlement.membershipId },
        data: {
          classesUsedThisWeek:
            entitlement.entitlementType === BookingEntitlementType.membership
              ? entitlement.weeklyUsage + 1
              : undefined,
        },
      });
    }

    return booking;
  });

  if (!promotedBooking) return null;

  await logEvent(sessionId, "waitlist_promoted", "Waitlist promoted", {
    userId: waiting.userId,
    bookingId: promotedBooking.id,
  });

  const [user, session] = await Promise.all([
    db.user.findUnique({ where: { id: waiting.userId } }),
    db.classSession.findUnique({ where: { id: sessionId } }),
  ]);

  if (user?.email && session) {
    void sendBookingConfirmation(
      user.email,
      user.firstName || user.name || "there",
      session.titleSnapshot,
      session.startsAtUtc.toISOString().slice(0, 10),
      session.startsAtUtc.toISOString().slice(11, 16),
      session.startsAtUtc,
      session.durationMinutes
    );
  }

  if (bookedCountBeforePromotion === 0) {
    await handleFirstBookedAttendee(sessionId, waiting.userId);
  }

  return promotedBooking;
}

export async function bookClassSession(
  sessionId: string,
  userId: string
): Promise<BookSessionResultDto> {
  const healthAccess = await getHealthAccessState(userId);
  if (!healthAccess.isComplete) {
    throw new Error("HEALTH_DECLARATION_REQUIRED");
  }

  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    include: {
      bookings: {
        where: { status: ClassBookingStatus.booked },
        select: { id: true },
      },
    },
  });

  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (
    session.status !== ClassSessionStatus.scheduled &&
    session.status !== ClassSessionStatus.live
  ) {
    throw new Error("SESSION_NOT_BOOKABLE");
  }
  if (session.startsAtUtc <= new Date()) {
    throw new Error("SESSION_STARTED");
  }

  const existingBooking = await db.classBooking.findFirst({
    where: {
      sessionId,
      userId,
      status: ClassBookingStatus.booked,
    },
  });
  if (existingBooking) {
    return {
      status: "booked",
      bookingId: existingBooking.id,
      sessionId,
      bookingMode:
        existingBooking.entitlementType === BookingEntitlementType.credit
          ? "credit"
          : existingBooking.entitlementType === BookingEntitlementType.membership
            ? "membership"
            : "manual",
    };
  }

  await removeFromWaitlist(sessionId, userId);

  const activeBookings = session.bookings.length;
  if (activeBookings < session.capacity) {
    const now = new Date();
    const booking = await db.$transaction(async (tx) => {
      const entitlement = await decideEntitlement(userId, now, tx);
      const bookingRef = `class_booking:${sessionId}:${userId}:${now.toISOString()}`;

      const creditLedger =
        entitlement.entitlementType === BookingEntitlementType.credit
          ? await consumeOneCreditForBooking({ userId, bookingRef, tx })
          : null;

      const booked = await tx.classBooking.upsert({
        where: { sessionId_userId: { sessionId, userId } },
        create: {
          sessionId,
          userId,
          status: ClassBookingStatus.booked,
          entitlementType: entitlement.entitlementType,
          creditLedgerEntryId: creditLedger?.id || null,
        },
        update: {
          status: ClassBookingStatus.booked,
          cancelledAt: null,
          entitlementType: entitlement.entitlementType,
          creditLedgerEntryId: creditLedger?.id || null,
        },
      });

      if (entitlement.membershipId) {
        await tx.membershipSubscription.update({
          where: { id: entitlement.membershipId },
          data: {
            classesUsedThisWeek:
              entitlement.entitlementType === BookingEntitlementType.membership
                ? entitlement.weeklyUsage + 1
                : undefined,
          },
        });
      }

      return booked;
    });

    await logEvent(sessionId, "booking_created", "Booking created", {
      userId,
      bookingId: booking.id,
    });

    const user = await db.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      void sendBookingConfirmation(
        user.email,
        user.firstName || user.name || "there",
        session.titleSnapshot,
        session.startsAtUtc.toISOString().slice(0, 10),
        session.startsAtUtc.toISOString().slice(11, 16),
        session.startsAtUtc,
        session.durationMinutes
      );
    }

    if (activeBookings === 0) {
      await handleFirstBookedAttendee(sessionId, userId);
    }

    return {
      status: "booked",
      bookingId: booking.id,
      sessionId,
      bookingMode:
        booking.entitlementType === BookingEntitlementType.credit
          ? "credit"
          : booking.entitlementType === BookingEntitlementType.membership
            ? "membership"
            : "manual",
    };
  }

  const waitlistEntry = await joinWaitlist(sessionId, userId);
  await logEvent(sessionId, "waitlist_joined", "Joined waitlist", {
    userId,
    waitlistEntryId: waitlistEntry.id,
    position: waitlistEntry.position,
  });

  return {
    status: "waitlisted",
    waitlistEntryId: waitlistEntry.id,
    sessionId,
    position: waitlistEntry.position,
    bookingMode: "waitlist",
  };
}

export async function cancelOwnBooking(sessionId: string, userId: string) {
  return cancelBookingForUser(sessionId, userId, {
    source: "self",
    cancelledByUserId: userId,
  });
}

export async function removeBookingAsAdmin(
  sessionId: string,
  bookingUserId: string,
  adminUserId: string
) {
  return cancelBookingForUser(sessionId, bookingUserId, {
    source: "admin",
    cancelledByUserId: adminUserId,
  });
}

async function cancelBookingForUser(
  sessionId: string,
  userId: string,
  meta: { source: "self" | "admin"; cancelledByUserId: string }
) {
  const booking = await db.classBooking.findFirst({
    where: {
      sessionId,
      userId,
      status: ClassBookingStatus.booked,
    },
  });

  if (!booking) {
    return {
      cancelled: false,
      promotedUserId: null as string | null,
      refundedCredit: false,
      autoCancelledForNoAttendance: false,
    };
  }

  const now = new Date();
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    select: {
      startsAtUtc: true,
      status: true,
      titleSnapshot: true,
      durationMinutes: true,
    },
  });

  let refundedCredit = false;
  const settings = await getClassOperationalSettings();

  await db.$transaction(async (tx) => {
    await tx.classBooking.update({
      where: { id: booking.id },
      data: {
        status: ClassBookingStatus.cancelled,
        cancelledAt: now,
      },
    });

    if (booking.entitlementType === BookingEntitlementType.membership) {
      const membership = await getBookableMembership(userId, tx);
      if (membership) {
        const usage = await getMembershipWeeklyUsage(userId, now, tx);
        await tx.membershipSubscription.update({
          where: { id: membership.id },
          data: {
            classesUsedThisWeek: Math.max(0, usage.used - 1),
          },
        });
      }
    }

    if (
      booking.entitlementType === BookingEntitlementType.credit &&
      session &&
      shouldRefundCreditForCancellation(session.startsAtUtc, settings, now)
    ) {
      const bookingRef = `class_booking_refund:${sessionId}:${userId}:${now.toISOString()}`;
      await refundOneCreditForBooking({ userId, bookingRef, tx });
      refundedCredit = true;
    }
  });

  await logEvent(sessionId, "booking_cancelled", "Booking cancelled", {
    userId,
    bookingId: booking.id,
    source: meta.source,
    cancelledByUserId: meta.cancelledByUserId,
  });

  const remainingActiveBookings = await getActiveBookedCount(sessionId);
  if (remainingActiveBookings === 0) {
    await resetFirstSignupInstructorNotification(sessionId);
  }

  let promoted = null as Awaited<ReturnType<typeof promoteFirstWaitlisted>> | null;
  let autoCancelledForNoAttendance = false;

  if (
    session &&
    session.status === ClassSessionStatus.scheduled &&
    remainingActiveBookings === 0 &&
    isInsideEmptyClassAutoCancelWindow(session.startsAtUtc, settings, now)
  ) {
    await autoCancelClassSessionForNoAttendance(sessionId, now);
    autoCancelledForNoAttendance = true;
  } else if (
    session &&
    session.status === ClassSessionStatus.scheduled &&
    !isInsideEmptyClassAutoCancelWindow(session.startsAtUtc, settings, now)
  ) {
    promoted = await promoteFirstWaitlisted(sessionId);
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      name: true,
      timezone: true,
      dateFormat: true,
    },
  });

  if (user?.email && session) {
    await Promise.allSettled([
      sendClassUnbooking(
        user.email,
        user.firstName || user.name || "there",
        session.titleSnapshot,
        session.startsAtUtc.toISOString().slice(0, 10),
        session.startsAtUtc.toISOString().slice(11, 16),
        session.startsAtUtc,
        session.durationMinutes,
        {
          timezone: user.timezone || "Europe/London",
          dateFormat: toDateFormatPreference(user.dateFormat),
        }
      ),
    ]);
  }

  return {
    cancelled: true,
    promotedUserId: promoted?.userId || null,
    refundedCredit,
    autoCancelledForNoAttendance,
  };
}

export async function leaveWaitlist(sessionId: string, userId: string) {
  const entry = await removeFromWaitlist(sessionId, userId);
  if (!entry) return { removed: false };
  return { removed: true };
}

export async function cancelClassSession(
  sessionId: string,
  cancelledByUserId: string,
  reason?: string
) {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    include: {
      bookings: {
        where: { status: ClassBookingStatus.booked },
        select: {
          userId: true,
          entitlementType: true,
        },
      },
      waitlist: {
        where: { status: ClassWaitlistStatus.waiting },
      },
    },
  });

  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.status === ClassSessionStatus.cancelled) {
    return { alreadyCancelled: true, cancelledBookings: 0, removedWaitlist: 0 };
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.classSession.update({
      where: { id: sessionId },
      data: {
        status: ClassSessionStatus.cancelled,
        cancelledAt: now,
        cancelledByUserId,
        cancelReason: reason || null,
      },
    });

    await tx.classBooking.updateMany({
      where: { sessionId, status: ClassBookingStatus.booked },
      data: { status: ClassBookingStatus.cancelled, cancelledAt: now },
    });

    await tx.classWaitlistEntry.updateMany({
      where: { sessionId, status: ClassWaitlistStatus.waiting },
      data: { status: ClassWaitlistStatus.removed },
    });

    const creditBookings = session.bookings.filter(
      (entry) => entry.entitlementType === BookingEntitlementType.credit
    );
    for (const creditBooking of creditBookings) {
      const bookingRef = `class_cancel_refund:${sessionId}:${creditBooking.userId}:${now.toISOString()}`;
      await refundOneCreditForBooking({ userId: creditBooking.userId, bookingRef, tx });
    }
  });

  await logEvent(sessionId, "session_cancelled", "Session cancelled", {
    cancelledByUserId,
    reason: reason || null,
    bookingCount: session.bookings.length,
    waitlistCount: session.waitlist.length,
  });

  const roomTeardown = await tearDownSessionRoom(sessionId).catch((error) => ({
    status: "failed" as const,
    message: error instanceof Error ? error.message : "Failed to close Daily room",
  }));
  if (roomTeardown.status === "failed") {
    console.error("Failed to tear down Daily room for cancelled session", roomTeardown.message);
  }

  const users = await db.user.findMany({
    where: {
      id: {
        in: Array.from(
          new Set([
            ...session.bookings.map((entry) => entry.userId),
            ...session.waitlist.map((entry) => entry.userId),
          ])
        ),
      },
    },
    select: {
      email: true,
      firstName: true,
      name: true,
      timezone: true,
      dateFormat: true,
    },
  });

  await Promise.allSettled(
    users.map((user) =>
      sendClassCancellation(
        user.email,
        user.firstName || user.name || "there",
        session.titleSnapshot,
        session.startsAtUtc.toISOString().slice(0, 10),
        session.startsAtUtc.toISOString().slice(11, 16),
        true,
        {
          timezone: user.timezone || "Europe/London",
          dateFormat: toDateFormatPreference(user.dateFormat),
        },
        session.startsAtUtc,
        session.durationMinutes
      )
    )
  );

  return {
    alreadyCancelled: false,
    cancelledBookings: session.bookings.length,
    removedWaitlist: session.waitlist.length,
  };
}

export async function cancelClassSessionsForWeek(params: {
  weekStart: string;
  cancelledByUserId: string;
  reason?: string;
}) {
  const weekStartDate = new Date(`${params.weekStart}T00:00:00.000Z`);
  if (Number.isNaN(weekStartDate.getTime())) {
    throw new Error("INVALID_WEEK_START");
  }

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 7);
  const now = new Date();

  const sessions = await db.classSession.findMany({
    where: {
      OR: [
        {
          localDate: {
            gte: weekStartDate,
            lt: weekEndDate,
          },
        },
        {
          localDate: null,
          startsAtUtc: {
            gte: weekStartDate,
            lt: weekEndDate,
          },
        },
      ],
    },
    select: {
      id: true,
      status: true,
      startsAtUtc: true,
    },
    orderBy: {
      startsAtUtc: "asc",
    },
  });

  let cancelledCount = 0;
  let skippedCount = 0;

  for (const session of sessions) {
    const canCancel =
      session.startsAtUtc > now &&
      (session.status === ClassSessionStatus.draft ||
        session.status === ClassSessionStatus.scheduled);

    if (!canCancel) {
      skippedCount += 1;
      continue;
    }

    const result = await cancelClassSession(session.id, params.cancelledByUserId, params.reason);
    if (result.alreadyCancelled) {
      skippedCount += 1;
      continue;
    }
    cancelledCount += 1;
  }

  return {
    weekStart: params.weekStart,
    weekEndExclusive: weekEndDate.toISOString().slice(0, 10),
    cancelledCount,
    skippedCount,
  };
}

export async function processThreeHourClassCutoff(now = new Date()) {
  const settings = await getClassOperationalSettings();
  const cutoff = new Date(now.getTime() + settings.emptyClassAutoCancelWindowMinutes * 60_000);
  const sessions = await db.classSession.findMany({
    where: {
      status: ClassSessionStatus.scheduled,
      startsAtUtc: {
        gt: now,
        lte: cutoff,
      },
      reminderProcessedAt: null,
      autoCancelledForNoAttendanceAt: null,
    },
    include: {
      bookings: {
        where: {
          status: ClassBookingStatus.booked,
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              name: true,
              timezone: true,
              dateFormat: true,
              notificationPreference: {
                select: {
                  classReminders: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      startsAtUtc: "asc",
    },
  });

  let cancelledCount = 0;
  let remindedCount = 0;

  for (const session of sessions) {
    if (session.bookings.length === 0) {
      await autoCancelClassSessionForNoAttendance(session.id, now);
      cancelledCount += 1;
      continue;
    }

    await db.classSession.update({
      where: { id: session.id },
      data: {
        reminderProcessedAt: now,
      },
    });

    for (const booking of session.bookings) {
      if (booking.user.notificationPreference?.classReminders === false) {
        continue;
      }

      const joinLink = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard/classes/${session.classDefinitionSlug}/join?sessionId=${session.id}`;

      void sendClassReminder(
        booking.user.email,
        booking.user.firstName || booking.user.name || "there",
        session.titleSnapshot,
        session.startsAtUtc.toISOString().slice(11, 16),
        joinLink,
        {
          timezone: booking.user.timezone,
          dateFormat: toDateFormatPreference(booking.user.dateFormat),
        },
        {
          preJoinWindowMinutes: settings.preJoinWindowMinutes,
        }
      );
    }

    remindedCount += 1;
  }

  return {
    cancelledCount,
    remindedCount,
    processedSessionCount: sessions.length,
  };
}
