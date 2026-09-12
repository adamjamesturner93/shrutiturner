import { createHash } from "node:crypto";
import { BillingRefundStatus, CreditEntryType, Prisma } from "@prisma/client";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { recordSubscriptionComplianceEvent } from "@/lib/billing/subscription-compliance";
import { addCredits } from "@/lib/credits/credit-service";
import { db } from "@/lib/db";

type Client = Prisma.TransactionClient | typeof db;

export async function getMembershipRefundCapacity(membershipId: string, tx: Client = db) {
  const membership = await tx.membershipSubscription.findUnique({
    where: { id: membershipId },
    select: { id: true, userId: true, latestInvoiceId: true, latestInvoiceAmountPence: true },
  });
  if (!membership?.latestInvoiceId || !membership.latestInvoiceAmountPence) {
    return { membership, refundablePence: 0, refundedPence: 0 };
  }
  const aggregate = await tx.billingRefund.aggregate({
    where: {
      membershipId,
      stripeInvoiceId: membership.latestInvoiceId,
      status: {
        in: [
          BillingRefundStatus.pending,
          BillingRefundStatus.succeeded,
          BillingRefundStatus.credited,
        ],
      },
    },
    _sum: { amountPence: true },
  });
  const refundedPence = aggregate._sum.amountPence || 0;
  return {
    membership,
    refundablePence: Math.max(0, membership.latestInvoiceAmountPence - refundedPence),
    refundedPence,
  };
}

export async function createMembershipRefund(input: {
  membershipId: string;
  actorUserId: string;
  amountPence: number;
  reason: string;
  idempotencyKey: string;
  expectedInvoiceId: string;
  /** Internal caller only; never accepted from the admin HTTP body. */
  source?: "admin" | "cooling_off";
  refundAsCredit?: boolean;
  creditAmount?: number;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  if (!Number.isSafeInteger(input.amountPence) || input.amountPence <= 0)
    throw new Error("INVALID_REFUND_AMOUNT");
  if (!input.reason.trim()) throw new Error("REFUND_REASON_REQUIRED");
  if (!/^[\w-]{16,100}$/.test(input.idempotencyKey || "")) throw new Error("REFUND_KEY_REQUIRED");
  if (!input.expectedInvoiceId) throw new Error("REFUND_PREVIEW_REQUIRED");
  if (
    input.refundAsCredit &&
    (!Number.isSafeInteger(input.creditAmount) || input.creditAmount <= 0)
  ) {
    throw new Error("INVALID_CREDIT_AMOUNT");
  }
  // Existing primary key is the durable request identity; no schema migration needed.
  const id = `mrefund_${createHash("sha256").update(`${input.actorUserId}:${input.idempotencyKey}`).digest("hex")}`;
  const reason = input.reason.trim();
  const refund = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "MembershipSubscription" WHERE "id" = ${input.membershipId} FOR UPDATE`;
    const previous = await tx.billingRefund.findUnique({ where: { id } });
    if (previous) {
      const metadata = previous.metadataJson as { creditAmount?: number } | null;
      if (
        previous.membershipId !== input.membershipId ||
        previous.stripeInvoiceId !== input.expectedInvoiceId ||
        (input.source !== "cooling_off" && previous.amountPence !== input.amountPence) ||
        previous.reason !== reason ||
        previous.refundedAsCredit !== Boolean(input.refundAsCredit) ||
        (input.refundAsCredit && metadata?.creditAmount !== input.creditAmount)
      )
        throw new Error("REFUND_KEY_CONFLICT");
      return previous;
    }
    const capacity = await getMembershipRefundCapacity(input.membershipId, tx);
    const membership = capacity.membership;
    if (!membership?.latestInvoiceId) throw new Error("MEMBERSHIP_INVOICE_NOT_FOUND");
    if (membership.latestInvoiceId !== input.expectedInvoiceId)
      throw new Error("REFUND_PREVIEW_STALE");
    const unresolved = await tx.billingRefund.findFirst({
      where: {
        membershipId: input.membershipId,
        stripeInvoiceId: membership.latestInvoiceId,
        status: BillingRefundStatus.pending,
        stripeRefundId: null,
      },
    });
    if (unresolved) throw new Error("REFUND_RECONCILIATION_REQUIRED");
    const amountPence = input.source === "cooling_off" ? Math.min(input.amountPence, capacity.refundablePence) : input.amountPence;
    if (amountPence <= 0 || amountPence > capacity.refundablePence)
      throw new Error("REFUND_AMOUNT_EXCEEDS_REMAINING");
    const reserved = await tx.billingRefund.create({
      data: {
        id,
        userId: membership.userId,
        membershipId: input.membershipId,
        actorUserId: input.source === "cooling_off" ? null : input.actorUserId,
        amountPence,
        reason,
        stripeInvoiceId: membership.latestInvoiceId,
        refundedAsCredit: Boolean(input.refundAsCredit),
        status: input.refundAsCredit ? BillingRefundStatus.credited : BillingRefundStatus.pending,
        metadataJson: input.refundAsCredit ? { creditAmount: input.creditAmount } : {},
      },
    });
    if (input.refundAsCredit) {
      await addCredits({
        userId: membership.userId,
        amount: input.creditAmount,
        type: CreditEntryType.admin_adjustment,
        description: `Membership refund credit: ${reason}`,
        sourceRef: `membership_refund:${id}`,
        stripeInvoiceId: membership.latestInvoiceId,
        createdByUserId: input.actorUserId,
        tx,
      });
    }
    if (input.source !== "cooling_off") await createAdminActionLog(
      {
        actorUserId: input.actorUserId,
        actionType: input.refundAsCredit
          ? "membership_refund_credit_issued"
          : "membership_refund_reserved",
        targetType: "membership",
        targetId: input.membershipId,
        reason,
        requestId: input.requestId,
        requestPath: input.requestPath,
        requestIp: input.requestIp,
        newValueJson: { amountPence: input.amountPence, billingRefundId: id },
      },
      tx
    );
    return reserved;
  });
  if (
    refund.refundedAsCredit ||
    refund.stripeRefundId ||
    refund.status !== BillingRefundStatus.pending
  )
    return refund;
  // Stripe can prune keys after 24 hours. Never automatically replay an old ambiguous request.
  if (Date.now() - refund.createdAt.getTime() >= 23 * 60 * 60 * 1000)
    throw new Error("REFUND_RECONCILIATION_REQUIRED");
  const stripe = getStripeClient();
  const invoice = await stripe.invoices.retrieve(refund.stripeInvoiceId, { expand: ["payments"] });
  const legacyInvoice = invoice as typeof invoice & { payment_intent?: string | { id?: string } };
  const paidPayments = invoice.payments?.data.filter(
    (item) => item.status === "paid" && item.payment.type === "payment_intent"
  );
  if (invoice.payments?.has_more || (paidPayments?.length || 0) > 1) {
    throw new Error("REFUND_RECONCILIATION_REQUIRED");
  }
  const payment = paidPayments?.[0];
  const intent = payment?.payment.payment_intent || legacyInvoice.payment_intent;
  const paymentIntentId = typeof intent === "string" ? intent : intent?.id;
  if (!paymentIntentId) throw new Error("MISSING_PAYMENT_INTENT");
  // No provider calls inside a transaction. Unknown outcomes keep capacity reserved.
  const stripeRefund = await stripe.refunds.create(
    {
      payment_intent: paymentIntentId,
      amount: refund.amountPence,
      reason: "requested_by_customer",
      metadata: { membershipId: refund.membershipId, billingRefundId: id },
    },
    { idempotencyKey: id }
  );
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "BillingRefund" WHERE "id" = ${id} FOR UPDATE`;
    const current = await tx.billingRefund.findUniqueOrThrow({ where: { id } });
    if (current.stripeRefundId) return current;
    const updated = await tx.billingRefund.update({
      where: { id },
      data: {
        stripeRefundId: stripeRefund.id,
        paymentIntentId,
        status:
          stripeRefund.status === "succeeded"
            ? BillingRefundStatus.succeeded
            : stripeRefund.status === "failed" || stripeRefund.status === "canceled"
              ? BillingRefundStatus.failed
              : BillingRefundStatus.pending,
        metadataJson: stripeRefund as unknown as Prisma.InputJsonValue,
      },
    });
    await recordSubscriptionComplianceEvent(
      {
        userId: refund.userId,
        membershipId: refund.membershipId,
        kind: "refund_issued",
        status: stripeRefund.status || "pending",
        channel: "stripe",
        summary: `${input.source === "cooling_off" ? "Cooling-off" : "Admin"} refund initiated for £${(refund.amountPence / 100).toFixed(2)}.`,
        metadataJson: {
          refundId: stripeRefund.id,
          billingRefundId: id,
          amountPence: refund.amountPence,
        },
      },
      tx
    );
    return updated;
  });
}
