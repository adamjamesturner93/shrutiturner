import "server-only";

import { RetreatLiveRoomState } from "@prisma/client";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";
import { setUpRetreatOnlineRoom } from "@/lib/retreats/service";
import { purgeExpiredRetreatChat } from "@/lib/retreats/live-service";
import RetreatLiveReminderEmail from "@/emails/retreat-live-reminder";
import { retryPendingEventCancellationRefunds } from "@/lib/retreats/event-cancellation";

const HOUR_MS = 60 * 60 * 1000;

function formatRetreatTime(startsAt: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(startsAt);
}

export async function prepareUpcomingRetreatLiveRooms() {
  const now = new Date();
  const cutoff = new Date(now.getTime() + 24 * HOUR_MS);
  const retreats = await db.retreatDate.findMany({
    where: {
      retreatType: "online",
      startsAt: { gt: now, lte: cutoff },
      status: { in: ["open", "sold_out", "closed"] },
      liveRoomState: RetreatLiveRoomState.unprepared,
    },
    select: { id: true },
  });
  let prepared = 0;
  let failed = 0;
  for (const retreat of retreats) {
    try {
      await setUpRetreatOnlineRoom(retreat.id);
      prepared += 1;
    } catch (error) {
      failed += 1;
      console.error("Failed to prepare online retreat room", { retreatDateId: retreat.id, error });
    }
  }
  return { processed: retreats.length, prepared, failed };
}

async function sendReminder(
  booking: {
    id: string;
    attendeeFirstName: string;
    attendeeEmail: string;
    attendeeUserId: string | null;
    retreatDate: {
      retreatTitleSnapshot: string;
      startsAt: Date;
      timezone: string;
    };
  },
  timing: "24h" | "1h"
) {
  const destination = `/dashboard/retreats/${booking.id}/${booking.attendeeUserId ? "live" : "setup"}`;
  const joinUrl = booking.attendeeUserId
    ? buildAbsoluteUrl(destination)
    : buildAbsoluteUrl(
        `/login?intent=online-workshop&email=${encodeURIComponent(booking.attendeeEmail)}&redirect=${encodeURIComponent(destination)}`
      );
  const calendarUrl = buildAbsoluteUrl(`/api/retreats/bookings/${booking.id}/calendar`);
  const dateTime = formatRetreatTime(booking.retreatDate.startsAt, booking.retreatDate.timezone);
  const reminderLabel = timing === "24h" ? "tomorrow" : "in about one hour";
  await sendPostmarkReactEmail({
    to: booking.attendeeEmail,
    subject: `${booking.retreatDate.retreatTitleSnapshot} begins ${reminderLabel}`,
    react: RetreatLiveReminderEmail({
      firstName: booking.attendeeFirstName,
      retreatName: booking.retreatDate.retreatTitleSnapshot,
      dateTime,
      reminderLabel,
      joinUrl,
      calendarUrl,
    }),
    textBody: `${booking.retreatDate.retreatTitleSnapshot} begins ${reminderLabel} (${dateTime}).\nOpen retreat: ${joinUrl}\nCalendar: ${calendarUrl}`,
    tag: `retreat-live-reminder-${timing}`,
    templateKey: `retreat-live-reminder-${timing}`,
    category: "transactional",
    dispatchMode: "immediate_best_effort",
    retryable: true,
    metadata: { bookingId: booking.id, reminderTiming: timing },
  });
}

export async function resendRetreatLiveAccessEmail(bookingId: string, retreatDateId: string) {
  const booking = await db.retreatBooking.findFirst({
    where: { id: bookingId, retreatDateId },
    include: {
      retreatDate: {
        select: {
          retreatType: true,
          retreatTitleSnapshot: true,
          startsAt: true,
          timezone: true,
          status: true,
        },
      },
    },
  });
  if (
    !booking ||
    booking.retreatDate.retreatType !== "online" ||
    booking.retreatDate.status === "cancelled"
  ) {
    throw new Error("NOT_FOUND");
  }
  if (!booking.attendeeEmail) throw new Error("ATTENDEE_EMAIL_MISSING");
  await sendReminder(booking, "24h");
  return booking;
}

export async function processRetreatLiveReminders() {
  const now = new Date();
  const bookings = await db.retreatBooking.findMany({
    where: {
      retreatDate: {
        retreatType: "online",
        status: { not: "cancelled" },
        startsAt: { gt: now, lte: new Date(now.getTime() + 25 * HOUR_MS) },
      },
      bookingStatus: { in: ["deposit_paid", "balance_due", "paid_in_full"] },
      paymentStatus: { in: ["deposit_paid", "partially_paid", "paid_in_full"] },
    },
    include: {
      retreatDate: {
        select: { retreatTitleSnapshot: true, startsAt: true, timezone: true },
      },
    },
  });
  let sent24h = 0;
  let sent1h = 0;
  for (const booking of bookings) {
    const remainingMs = booking.retreatDate.startsAt.getTime() - now.getTime();
    if (remainingMs <= 90 * 60 * 1000 && !booking.liveReminder1hSentAt) {
      const claimed = await db.retreatBooking.updateMany({
        where: { id: booking.id, liveReminder1hSentAt: null },
        data: { liveReminder1hSentAt: new Date() },
      });
      if (claimed.count) {
        try {
          await sendReminder(booking, "1h");
          sent1h += 1;
        } catch (error) {
          await db.retreatBooking.updateMany({
            where: { id: booking.id },
            data: { liveReminder1hSentAt: null },
          });
          throw error;
        }
      }
    } else if (remainingMs <= 25 * HOUR_MS && !booking.liveReminder24hSentAt) {
      const claimed = await db.retreatBooking.updateMany({
        where: { id: booking.id, liveReminder24hSentAt: null },
        data: { liveReminder24hSentAt: new Date() },
      });
      if (claimed.count) {
        try {
          await sendReminder(booking, "24h");
          sent24h += 1;
        } catch (error) {
          await db.retreatBooking.updateMany({
            where: { id: booking.id },
            data: { liveReminder24hSentAt: null },
          });
          throw error;
        }
      }
    }
  }

  const gifts = await db.giftPurchase.findMany({
    where: {
      type: "retreat",
      status: "purchased",
      retreatDate: {
        retreatType: "online",
        status: { not: "cancelled" },
        startsAt: { gt: now, lte: new Date(now.getTime() + 25 * HOUR_MS) },
      },
      cancellationRequests: {
        none: { status: { in: ["requested", "approved", "processing", "failed"] } },
      },
    },
    include: { retreatDate: true },
  });
  let giftRemindersSent = 0;
  for (const gift of gifts) {
    if (!gift.retreatDate) continue;
    const remainingMs = gift.retreatDate.startsAt.getTime() - now.getTime();
    const timing = remainingMs <= 90 * 60 * 1000 ? "1h" : "24h";
    const timestampField = timing === "1h" ? "liveReminder1hSentAt" : "liveReminder24hSentAt";
    if (gift[timestampField]) continue;
    const claimed = await db.giftPurchase.updateMany({
      where: { id: gift.id, [timestampField]: null },
      data: { [timestampField]: new Date() },
    });
    if (!claimed.count) continue;
    try {
      const dateTime = formatRetreatTime(gift.retreatDate.startsAt, gift.retreatDate.timezone);
      const redemptionUrl = buildAbsoluteUrl(`/gift/redeem/${gift.code}`);
      const sendToBuyer = gift.deliveryTarget === "buyer";
      await sendPostmarkReactEmail({
        to: sendToBuyer ? gift.purchaserEmail : gift.recipientEmail,
        subject: `${gift.retreatDate.retreatTitleSnapshot} begins ${timing === "1h" ? "in about one hour" : "tomorrow"}`,
        react: RetreatLiveReminderEmail({
          firstName: sendToBuyer ? gift.purchaserFirstName : gift.recipientFirstName,
          retreatName: gift.retreatDate.retreatTitleSnapshot,
          dateTime,
          reminderLabel: timing === "1h" ? "in about one hour" : "tomorrow",
          joinUrl: redemptionUrl,
          calendarUrl: buildAbsoluteUrl(`/retreats/${gift.retreatDate.retreatSlug}`),
        }),
        textBody: `${gift.retreatDate.retreatTitleSnapshot} begins ${timing === "1h" ? "in about one hour" : "tomorrow"} (${dateTime}). Redeem and complete setup: ${redemptionUrl}`,
        tag: `retreat-gift-live-reminder-${timing}`,
        templateKey: `retreat-gift-live-reminder-${timing}`,
        category: "transactional",
        dispatchMode: "immediate_best_effort",
        retryable: true,
        metadata: { giftPurchaseId: gift.id, reminderTiming: timing },
      });
      giftRemindersSent += 1;
    } catch (error) {
      await db.giftPurchase.update({
        where: { id: gift.id },
        data: { [timestampField]: null },
      });
      console.error("Failed to send online workshop gift reminder", error);
    }
  }
  return {
    processed: bookings.length,
    sent24h,
    sent1h,
    giftsProcessed: gifts.length,
    giftRemindersSent,
  };
}

export async function maintainRetreatLiveSessions() {
  const [rooms, reminders, chat, cancellations] = await Promise.all([
    prepareUpcomingRetreatLiveRooms(),
    processRetreatLiveReminders(),
    purgeExpiredRetreatChat(),
    retryPendingEventCancellationRefunds(),
  ]);
  return { rooms, reminders, chat, cancellations };
}
