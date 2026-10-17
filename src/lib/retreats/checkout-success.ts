import "server-only";

import { getStripeClient } from "@/lib/billing/stripe-client";
import { db } from "@/lib/db";

export type RetreatCheckoutSuccessState = {
  kind: "booking" | "gift";
  title: string;
  firstName: string;
  email: string;
  bookingId: string | null;
  isOnline: boolean;
  paymentComplete: boolean;
  guestCount: number;
  paidNowPence: number;
  currency: string;
  balancePence: number;
  balanceDueAt: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  roomLabel: string | null;
  deliveryTarget?: string;
};

export async function getRetreatCheckoutSuccessState(
  sessionId: string
): Promise<RetreatCheckoutSuccessState> {
  if (!sessionId.startsWith("cs_")) throw new Error("INVALID_SESSION");
  const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
  const paymentComplete =
    session.payment_status === "paid" ||
    (session.status === "complete" && session.payment_status === "no_payment_required");
  const kind = session.metadata?.kind;

  if (kind === "retreat_gift" && session.metadata?.giftPurchaseId) {
    const gift = await db.giftPurchase.findUnique({
      where: { id: session.metadata.giftPurchaseId },
      include: { retreatDate: true, retreatRoomOption: true },
    });
    if (!gift?.retreatDate || gift.stripeCheckoutSessionId !== session.id) {
      throw new Error("INVALID_SESSION");
    }
    return {
      kind: "gift",
      title: gift.retreatDate.retreatTitleSnapshot,
      firstName: gift.purchaserFirstName,
      email: gift.purchaserEmail,
      bookingId: null,
      isOnline: gift.retreatDate.retreatType === "online",
      paymentComplete,
      guestCount: gift.retreatGuestCount || 1,
      paidNowPence: session.amount_total ?? gift.totalPaidPence,
      currency: gift.currency,
      balancePence: 0,
      balanceDueAt: null,
      startsAt: gift.retreatDate.startsAt.toISOString(),
      endsAt: gift.retreatDate.endsAt.toISOString(),
      timezone: gift.retreatDate.timezone,
      roomLabel: gift.retreatRoomOption?.label || null,
      deliveryTarget: gift.deliveryTarget,
    };
  }

  if (kind === "retreat_instalment" && session.metadata?.bookingId) {
    const booking = await db.retreatBooking.findUnique({
      where: { id: session.metadata.bookingId },
      include: { retreatDate: true },
    });
    if (!booking || booking.stripeDepositSessionId !== session.id) {
      throw new Error("INVALID_SESSION");
    }
    return {
      kind: "booking",
      title: booking.retreatDate.retreatTitleSnapshot,
      firstName: booking.purchaserFirstName,
      email: booking.purchaserEmail,
      bookingId: booking.id,
      isOnline: booking.retreatDate.retreatType === "online",
      paymentComplete,
      guestCount: booking.attendeeCount,
      paidNowPence: session.amount_total ?? booking.depositAmountPence,
      currency: booking.currency,
      balancePence: Math.max(0, booking.balanceAmountPence - booking.balancePaidPence),
      balanceDueAt: booking.balanceDueAt?.toISOString() || null,
      startsAt: booking.retreatDate.startsAt.toISOString(),
      endsAt: booking.retreatDate.endsAt.toISOString(),
      timezone: booking.retreatDate.timezone,
      roomLabel: booking.roomOptionLabelSnapshot,
    };
  }

  throw new Error("INVALID_SESSION");
}
