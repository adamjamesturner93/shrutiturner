import { CreditEntryType, ReferralLedgerType } from "@prisma/client";
import { db } from "@/lib/db";
import type { BillingHistoryItemDto } from "@/lib/api/types";

type StripeInvoiceObject = {
  amount_paid?: number;
  amount_due?: number;
  id?: string;
  hosted_invoice_url?: string | null;
};

type StripeCheckoutObject = {
  amount_total?: number;
  id?: string;
  metadata?: {
    kind?: string;
  };
};

export async function getBillingHistory(
  userId: string,
  limit = 50
): Promise<BillingHistoryItemDto[]> {
  const [creditEntries, referralEntries, billingEvents] = await Promise.all([
    db.creditLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.referralLedgerEntry.findMany({
      where: { userId, type: ReferralLedgerType.applied },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.billingEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  const checkoutEvents = billingEvents.filter(
    (event) => event.type === "checkout.session.completed"
  );
  const invoicePaidEvents = billingEvents.filter((event) => event.type === "invoice.paid");
  const invoiceFailedEvents = billingEvents.filter(
    (event) => event.type === "invoice.payment_failed"
  );

  const fromStripeCreditPurchases: BillingHistoryItemDto[] = checkoutEvents
    .map((event) => {
      const stripeObject = (event.payloadJson as { data?: { object?: StripeCheckoutObject } })?.data
        ?.object;
      if (stripeObject?.metadata?.kind !== "credits") return null;
      return {
        id: `checkout_${event.id}`,
        createdAt: event.createdAt.toISOString(),
        kind: "credit_purchase" as const,
        description: "Class credit purchase",
        amountPence: stripeObject.amount_total || 0,
        status: "paid" as const,
        stripeCheckoutSessionId: stripeObject.id || null,
      };
    })
    .filter(Boolean) as BillingHistoryItemDto[];

  const fromStripeMemberships: BillingHistoryItemDto[] = invoicePaidEvents.map((event) => {
    const stripeObject = (event.payloadJson as { data?: { object?: StripeInvoiceObject } })?.data
      ?.object;
    return {
      id: `invoice_paid_${event.id}`,
      createdAt: event.createdAt.toISOString(),
      kind: "membership_charge",
      description: "Membership payment",
      amountPence: stripeObject?.amount_paid || 0,
      status: "paid",
      stripeInvoiceId: stripeObject?.id || null,
      invoiceUrl: stripeObject?.hosted_invoice_url || null,
    };
  });

  const fromEvents: BillingHistoryItemDto[] = invoiceFailedEvents.map((event) => {
    const stripeObject = (event.payloadJson as { data?: { object?: StripeInvoiceObject } })?.data
      ?.object;
    return {
      id: `billing_${event.id}`,
      createdAt: event.createdAt.toISOString(),
      kind: "payment_failed",
      description: "Subscription payment failed",
      amountPence: stripeObject?.amount_due || 0,
      status: "failed",
      stripeInvoiceId: stripeObject?.id || null,
      invoiceUrl: stripeObject?.hosted_invoice_url || null,
    };
  });

  const fromCredits: BillingHistoryItemDto[] = creditEntries
    .map((entry) => {
      if (entry.type === CreditEntryType.booking_refund) {
        return {
          id: `credit_${entry.id}`,
          createdAt: entry.createdAt.toISOString(),
          kind: "credit_refund" as const,
          description: `${entry.description} (${Math.abs(entry.amount)} credit refunded)`,
          amountPence: 0,
          status: "refunded" as const,
        };
      }
      if (entry.type === CreditEntryType.booking_use) {
        return {
          id: `credit_${entry.id}`,
          createdAt: entry.createdAt.toISOString(),
          kind: "booking_use" as const,
          description: `${entry.description} (${Math.abs(entry.amount)} credit used)`,
          amountPence: 0,
          status: "applied" as const,
        };
      }
      return null;
    })
    .filter(Boolean) as BillingHistoryItemDto[];

  const fromReferrals: BillingHistoryItemDto[] = referralEntries.map((entry) => ({
    id: `referral_${entry.id}`,
    createdAt: entry.createdAt.toISOString(),
    kind: "referral_discount",
    description: entry.description,
    amountPence: Math.abs(entry.amountPence),
    status: "applied",
    stripeCheckoutSessionId: entry.stripeCheckoutSessionId,
    stripeInvoiceId: entry.stripeInvoiceId,
  }));

  return [
    ...fromStripeCreditPurchases,
    ...fromStripeMemberships,
    ...fromCredits,
    ...fromReferrals,
    ...fromEvents,
  ]
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, limit);
}
