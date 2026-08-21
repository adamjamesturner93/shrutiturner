import { AcceptanceType } from "@prisma/client";
import { db } from "@/lib/db";
import { recordAcceptanceEvent } from "@/lib/legal/acceptance-service";
import { ensureSubscriberLinkedToUser } from "@/lib/newsletter/subscriber-service";
import { ensureRetreatOnlineAccessEntitlement } from "@/lib/retreats/service";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function promoteMatchingGuestAcceptances(userId: string, email: string) {
  const events = await db.guestAcceptanceEvent.findMany({
    where: {
      purchaserEmail: email,
      promotedAt: null,
      policyVersion: { isCurrent: true },
      OR: [
        { retreatBooking: { purchaserUserId: userId } },
        { retreatBooking: { attendeeUserId: userId } },
        { giftPurchase: { purchaserUserId: userId } },
      ],
    },
    orderBy: { acceptedAt: "asc" },
  });

  for (const event of events) {
    const claimed = await db.guestAcceptanceEvent.updateMany({
      where: { id: event.id, promotedAt: null },
      data: { promotedAt: new Date(), promotedToUserId: userId },
    });
    if (!claimed.count) continue;
    try {
      await recordAcceptanceEvent({
        userId,
        actorUserId: userId,
        type: event.type as AcceptanceType,
        surface: `${event.acceptanceSurface}_verified_claim`,
        metadataJson: {
          guestAcceptanceEventId: event.id,
          originallyAcceptedAt: event.acceptedAt.toISOString(),
        },
      });
    } catch (error) {
      await db.guestAcceptanceEvent.updateMany({
        where: { id: event.id, promotedToUserId: userId },
        data: { promotedAt: null, promotedToUserId: null },
      });
      throw error;
    }
  }
}

export async function linkPendingRecordsForUser(userId: string, emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!email) return;

  await Promise.all([
    ensureSubscriberLinkedToUser(userId, email),
    db.retreatBooking.updateMany({
      where: { purchaserEmail: email, purchaserUserId: null },
      data: { purchaserUserId: userId },
    }),
    db.retreatBooking.updateMany({
      where: { attendeeEmail: email, attendeeUserId: null },
      data: { attendeeUserId: userId },
    }),
    db.coachingApplication.updateMany({
      where: { applicantEmail: email, userId: null },
      data: { userId },
    }),
    db.smallGroupProgrammeEnrollment.updateMany({
      where: { attendeeEmail: email, userId: null },
      data: { userId },
    }),
    db.giftPurchase.updateMany({
      where: { purchaserEmail: email, purchaserUserId: null },
      data: { purchaserUserId: userId },
    }),
  ]);

  const linkedOnlineBookings = await db.retreatBooking.findMany({
    where: {
      attendeeUserId: userId,
      attendeeEmail: email,
      bookingStatus: {
        in: ["deposit_paid", "balance_due", "paid_in_full"],
      },
      retreatDate: { retreatType: "online" },
    },
    select: { id: true },
  });
  await Promise.all(
    linkedOnlineBookings.map((booking) => ensureRetreatOnlineAccessEntitlement(booking.id))
  );
  await promoteMatchingGuestAcceptances(userId, email);
}
