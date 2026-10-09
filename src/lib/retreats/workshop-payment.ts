import "server-only";
import { getStripeClient } from "@/lib/billing/stripe-client";

export const WORKSHOP_DISCOUNT_VERSION = "2";

export async function getWorkshopPayment(input: {
  sessionId: string;
  expectedSessionId: string | null;
  reference: { bookingId: string } | { giftPurchaseId: string };
  currency: string;
  productId: string | null;
  originalTotalPence: number;
  items: Array<{ id: string; addonId?: string | null; originalPence: number }>;
}) {
  const mismatch = () => {
    throw new Error("WORKSHOP_PAYMENT_MISMATCH");
  };
  if (input.sessionId !== input.expectedSessionId || !input.productId) mismatch();
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
    expand: ["discounts.promotion_code"],
  });
  if (
    session.metadata?.workshopDiscountVersion !== WORKSHOP_DISCOUNT_VERSION ||
    !Object.entries(input.reference).every(([key, value]) => session.metadata?.[key] === value) ||
    session.currency?.toLowerCase() !== input.currency.toLowerCase() ||
    session.amount_subtotal !== input.originalTotalPence ||
    session.status !== "complete" ||
    !["paid", "no_payment_required"].includes(session.payment_status)
  )
    mismatch();
  const lines = await stripe.checkout.sessions.listLineItems(input.sessionId, {
    limit: 100,
    expand: ["data.price.product"],
  });
  if (lines.has_more || lines.data.length !== input.items.length) mismatch();
  const remaining = new Map(input.items.map((item) => [item.id, item]));
  const items = lines.data.map((line) => {
    const product = line.price?.product;
    const productId = typeof product === "string" ? product : product?.id;
    const addonId =
      product && typeof product !== "string" && "metadata" in product
        ? product.metadata.addonId
        : null;
    const item = [...remaining.values()].find((item) =>
      item.addonId ? item.addonId === addonId : productId === input.productId
    );
    if (
      !item ||
      line.currency !== input.currency.toLowerCase() ||
      line.amount_subtotal !== item.originalPence ||
      line.quantity !== 1 ||
      line.amount_tax !== 0 ||
      line.amount_discount < 0 ||
      line.amount_total < 0 ||
      line.amount_total !== line.amount_subtotal - line.amount_discount
    )
      return mismatch();
    remaining.delete(item.id);
    return { id: item.id, totalPence: line.amount_total };
  });
  const totalPence = items.reduce((sum, item) => sum + item.totalPence, 0);
  if (
    remaining.size ||
    totalPence !== session.amount_total ||
    input.originalTotalPence - totalPence !== session.total_details?.amount_discount
  )
    mismatch();
  const reference = session.discounts?.[0]?.promotion_code;
  const promotion =
    typeof reference === "string" ? await stripe.promotionCodes.retrieve(reference) : reference;
  return {
    items,
    totalPence,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
    originalTotalPence: input.originalTotalPence,
    promotionDiscountPence: input.originalTotalPence - totalPence,
    promotionCodeSnapshot: promotion?.code || null,
    stripePromotionCodeId: promotion?.id || null,
  };
}
