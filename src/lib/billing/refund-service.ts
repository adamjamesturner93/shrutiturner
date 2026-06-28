import { BillingRefundStatus, Prisma } from "@prisma/client";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { recordSubscriptionComplianceEvent } from "@/lib/billing/subscription-compliance";
import { db } from "@/lib/db";

type StripeInvoiceWithPaymentIntent = Awaited<
  ReturnType<ReturnType<typeof getStripeClient>["invoices"]["retrieve"]>
> & {
  payment_intent?: string | { id?: string | null } | null;
};

function getPaymentIntentId(invoice: StripeInvoiceWithPaymentIntent) {
  return typeof invoice.payment_intent === "string"
    ? invoice.payment_intent
    : invoice.payment_intent?.id || null;
}

function formatMoney(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export async function getMembershipRefundCapacity(membershipId: string) {
  const membership = await db.membershipSubscription.findUnique({
    where: { id: membershipId },
    select: {
      id: true,
      userId: true,
      latestInvoiceId: true,
      latestInvoiceAmountPence: true,
    },
  });
  if (!membership?.latestInvoiceId || !membership.latestInvoiceAmountPence) {
    return { membership, refundablePence: 0, refundedPence: 0 };
  }

  const aggregate = await db.billingRefund.aggregate({
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
  refundAsCredit?: boolean;
  creditAmount?: number;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  if (!Number.isInteger(input.amountPence) || input.amountPence <= 0) {
    throw new Error("INVALID_REFUND_AMOUNT");
  }
  if (!input.reason.trim()) {
    throw new Error("REFUND_REASON_REQUIRED");
  }

  const capacity = await getMembershipRefundCapacity(input.membershipId);
  const membership = capacity.membership;
  if (!membership?.latestInvoiceId) {
    throw new Error("MEMBERSHIP_INVOICE_NOT_FOUND");
  }
  if (input.amountPence > capacity.refundablePence) {
    throw new Error("REFUND_AMOUNT_EXCEEDS_REMAINING");
  }

  if (input.refundAsCredit) {
    throw new Error("CLASS_CREDITS_RETIRED");
  }

  const stripe = getStripeClient();
  const invoice = (await stripe.invoices.retrieve(
    membership.latestInvoiceId
  )) as StripeInvoiceWithPaymentIntent;
  const paymentIntentId = getPaymentIntentId(invoice);
  if (!paymentIntentId) {
    throw new Error("MISSING_PAYMENT_INTENT");
  }

  const stripeRefund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: input.amountPence,
    reason: "requested_by_customer",
    metadata: {
      membershipId: input.membershipId,
      userId: membership.userId,
      actorUserId: input.actorUserId,
      reason: input.reason,
    },
  });

  const refund = await db.billingRefund.create({
    data: {
      userId: membership.userId,
      membershipId: input.membershipId,
      actorUserId: input.actorUserId,
      amountPence: input.amountPence,
      reason: input.reason,
      status:
        stripeRefund.status === "succeeded"
          ? BillingRefundStatus.succeeded
          : stripeRefund.status === "failed"
            ? BillingRefundStatus.failed
            : BillingRefundStatus.pending,
      stripeRefundId: stripeRefund.id,
      stripeInvoiceId: membership.latestInvoiceId,
      paymentIntentId,
      metadataJson: stripeRefund as unknown as Prisma.InputJsonValue,
    },
  });

  await recordSubscriptionComplianceEvent({
    userId: membership.userId,
    membershipId: input.membershipId,
    kind: "refund_issued",
    status: stripeRefund.status || "pending",
    channel: "stripe",
    summary: `Admin refund initiated for ${formatMoney(input.amountPence)}.`,
    metadataJson: {
      refundId: stripeRefund.id,
      billingRefundId: refund.id,
      amountPence: input.amountPence,
      reason: input.reason,
    },
  });
  await createAdminActionLog({
    actorUserId: input.actorUserId,
    actionType: "membership_refund_issued",
    targetType: "membership",
    targetId: input.membershipId,
    reason: input.reason,
    requestId: input.requestId,
    requestPath: input.requestPath,
    requestIp: input.requestIp,
    newValueJson: {
      amountPence: input.amountPence,
      stripeRefundId: stripeRefund.id,
      billingRefundId: refund.id,
    },
  });

  return refund;
}
