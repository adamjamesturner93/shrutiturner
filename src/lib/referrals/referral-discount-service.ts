import { ReferralLedgerType } from "@prisma/client";
import { db } from "@/lib/db";

export async function getReferralBalancePence(userId: string) {
  const rows = await db.referralLedgerEntry.findMany({
    where: { userId },
    select: { amountPence: true },
  });
  return rows.reduce((sum, row) => sum + row.amountPence, 0);
}

export async function computeReferralDiscountPence(userId: string, payableAmountPence: number) {
  const balance = await getReferralBalancePence(userId);
  return Math.max(0, Math.min(balance, payableAmountPence));
}

export async function consumeReferralDiscount({
  userId,
  amountPence,
  description,
  billingEventId,
  stripeInvoiceId,
  stripeCheckoutSessionId,
}: {
  userId: string;
  amountPence: number;
  description: string;
  billingEventId?: string;
  stripeInvoiceId?: string;
  stripeCheckoutSessionId?: string;
}) {
  if (amountPence <= 0) return null;

  return db.referralLedgerEntry.create({
    data: {
      userId,
      amountPence: -Math.abs(amountPence),
      currency: "GBP",
      type: ReferralLedgerType.applied,
      description,
      appliedToBillingEventId: billingEventId,
      stripeInvoiceId,
      stripeCheckoutSessionId,
    },
  });
}
