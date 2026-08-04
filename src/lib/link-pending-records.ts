import { db } from "@/lib/db";
import { ensureSubscriberLinkedToUser } from "@/lib/newsletter/subscriber-service";
import { ensureRetreatOnlineAccessEntitlement } from "@/lib/retreats/service";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
}
