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
};

export async function getRetreatCheckoutSuccessState(
  sessionId: string
): Promise<RetreatCheckoutSuccessState> {
  if (!sessionId.startsWith("cs_")) throw new Error("INVALID_SESSION");
  const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
  const paymentComplete = session.payment_status === "paid" || session.status === "complete";
  const kind = session.metadata?.kind;

  if (kind === "retreat_gift" && session.metadata?.giftPurchaseId) {
    const gift = await db.giftPurchase.findUnique({
      where: { id: session.metadata.giftPurchaseId },
      include: { retreatDate: true },
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
    };
  }

  throw new Error("INVALID_SESSION");
}
