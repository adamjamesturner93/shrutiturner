import "server-only";

import { RetreatLiveRoomState } from "@prisma/client";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";
import { setUpRetreatOnlineRoom } from "@/lib/retreats/service";
import { purgeExpiredRetreatChat } from "@/lib/retreats/live-service";
import RetreatLiveReminderEmail from "@/emails/retreat-live-reminder";

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
    retreatDate: {
      retreatTitleSnapshot: string;
      startsAt: Date;
      timezone: string;
    };
  },
  timing: "24h" | "1h"
) {
  const joinUrl = buildAbsoluteUrl(`/dashboard/retreats/${booking.id}/live`);
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

export async function processRetreatLiveReminders() {
  const now = new Date();
  const bookings = await db.retreatBooking.findMany({
    where: {
      retreatDate: {
        retreatType: "online",
        startsAt: { gt: now, lte: new Date(now.getTime() + 25 * HOUR_MS) },
      },
      attendeeUserId: { not: null },
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
  return { processed: bookings.length, sent24h, sent1h };
}

export async function maintainRetreatLiveSessions() {
  const [rooms, reminders, chat] = await Promise.all([
    prepareUpcomingRetreatLiveRooms(),
    processRetreatLiveReminders(),
    purgeExpiredRetreatChat(),
  ]);
  return { rooms, reminders, chat };
}
