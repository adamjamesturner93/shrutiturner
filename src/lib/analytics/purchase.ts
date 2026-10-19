import "server-only";
import { createHash } from "node:crypto";
import { eventType, type Purchase } from "./contracts";
export function checkoutReference(sessionId: string) {
  return createHash("sha256").update(`ga-initial:${sessionId}`).digest("hex");
}

export function initialPurchase(input: {
  sessionId: string;
  expectedSessionId: string | null;
  status: string | null;
  paymentStatus: string;
  amount: number | null;
  currency: string | null;
  kind: string | undefined;
  sequence?: string;
  slug: string;
  eventKind: string;
  outstandingPence: number;
  cancelled?: boolean;
}): Purchase | null {
  if (
    input.cancelled ||
    input.sessionId !== input.expectedSessionId ||
    input.status !== "complete" ||
    input.paymentStatus !== "paid" ||
    input.amount == null ||
    !Number.isSafeInteger(input.amount) ||
    input.amount <= 0 ||
    input.currency?.toUpperCase() !== "GBP"
  )
    return null;
  if (
    input.kind !== "retreat_gift" &&
    !(input.kind === "retreat_instalment" && (input.sequence === "1" || !input.sequence))
  )
    return null;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(input.slug)) return null;
  return {
    transaction_id: checkoutReference(input.sessionId),
    currency: "GBP",
    value: input.amount / 100,
    payment_type: input.outstandingPence > 0 ? "deposit" : "full",
    items: [
      {
        item_id: input.slug,
        item_category: eventType(input.eventKind),
        price: input.amount / 100,
        quantity: 1,
      },
    ],
  };
}
