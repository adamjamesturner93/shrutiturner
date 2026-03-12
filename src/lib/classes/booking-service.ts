import {
  BookingEntitlementType,
  ClassBookingStatus,
  ClassSessionStatus,
  ClassWaitlistStatus,
  MembershipStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { sendBookingConfirmation, sendClassCancellation } from "@/lib/email";
import { getFirstWaiting, joinWaitlist, removeFromWaitlist } from "@/lib/classes/waitlist-service";
import type { BookSessionResultDto } from "@/lib/classes/types";
import { consumeOneCreditForBooking, refundOneCreditForBooking } from "@/lib/credits/credit-service";

async function logEvent(sessionId: string, type: "booking_created" | "booking_cancelled" | "waitlist_joined" | "waitlist_promoted" | "session_cancelled", message?: string, payload?: Record<string, unknown>) {
  await db.classSessionEvent.create({
    data: {
      sessionId,
      type,
      message,
      payload,
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

async function getMembershipWeeklyUsage(
  userId: string,
  now: Date,
  tx: typeof db = db
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

async function getBookableMembership(userId: string, tx: typeof db = db) {
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

async function decideEntitlement(userId: string, now: Date, tx: typeof db = db) {
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

export async function bookClassSession(sessionId: string, userId: string): Promise<BookSessionResultDto> {
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
  if (![ClassSessionStatus.scheduled, ClassSessionStatus.live].includes(session.status)) {
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

    await logEvent(sessionId, "booking_created", "Booking created", { userId, bookingId: booking.id });

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

async function promoteFirstWaitlisted(sessionId: string) {
  const waiting = await getFirstWaiting(sessionId);
  if (!waiting) return null;

  const promotedBooking = await db.$transaction(async (tx) => {
    const row = await tx.classWaitlistEntry.findUnique({ where: { id: waiting.id } });
    if (!row || row.status !== ClassWaitlistStatus.waiting) {
      return null;
    }

    let entitlement:
      | { entitlementType: BookingEntitlementType; membershipId: string | null; weeklyUsage: number }
      | null = null;
    try {
      entitlement = await decideEntitlement(waiting.userId, new Date(), tx);
    } catch {
      // User is still on waitlist but currently not entitled to a class slot.
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

  return promotedBooking;
}

export async function cancelOwnBooking(sessionId: string, userId: string) {
  return cancelBookingForUser(sessionId, userId, {
    source: "self",
    cancelledByUserId: userId,
  });
}

export async function removeBookingAsAdmin(sessionId: string, bookingUserId: string, adminUserId: string) {
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
    return { cancelled: false, promotedUserId: null as string | null, refundedCredit: false };
  }

  const now = new Date();
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    select: { startsAtUtc: true },
  });

  let refundedCredit = false;

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
      session.startsAtUtc > now
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

  const promoted = await promoteFirstWaitlisted(sessionId);
  return {
    cancelled: true,
    promotedUserId: promoted?.userId || null,
    refundedCredit,
  };
}

export async function leaveWaitlist(sessionId: string, userId: string) {
  const entry = await removeFromWaitlist(sessionId, userId);
  if (!entry) return { removed: false };
  return { removed: true };
}

export async function cancelClassSession(sessionId: string, cancelledByUserId: string, reason?: string) {
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
      (booking) => booking.entitlementType === BookingEntitlementType.credit
    );
    for (const booking of creditBookings) {
      const bookingRef = `class_cancel_refund:${sessionId}:${booking.userId}:${now.toISOString()}`;
      await refundOneCreditForBooking({ userId: booking.userId, bookingRef, tx });
    }
  });

  await logEvent(sessionId, "session_cancelled", "Session cancelled", {
    cancelledByUserId,
    reason: reason || null,
    bookingCount: session.bookings.length,
    waitlistCount: session.waitlist.length,
  });

  const users = await db.user.findMany({
    where: {
      id: {
        in: Array.from(
          new Set([
            ...session.bookings.map((b) => b.userId),
            ...session.waitlist.map((w) => w.userId),
          ])
        ),
      },
    },
  });

  for (const user of users) {
    void sendClassCancellation(
      user.email,
      user.firstName || user.name || "there",
      session.titleSnapshot,
      session.startsAtUtc.toISOString().slice(0, 10),
      session.startsAtUtc.toISOString().slice(11, 16),
      true
    );
  }

  return {
    alreadyCancelled: false,
    cancelledBookings: session.bookings.length,
    removedWaitlist: session.waitlist.length,
  };
}
