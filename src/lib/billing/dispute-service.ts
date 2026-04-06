import { BillingDisputeStatus, type Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { db } from "@/lib/db";

type StripeDisputeLike = Stripe.Dispute & {
  payment_intent?: string | null;
  charge?:
    | string
    | null
    | { id?: string | null; customer?: string | { id?: string | null } | null };
};

function normalizeDisputeStatus(status?: string | null): BillingDisputeStatus {
  const token = (status || "").toLowerCase();
  if (token === "won") return BillingDisputeStatus.won;
  if (token === "lost") return BillingDisputeStatus.lost;
  if (token === "warning_closed") return BillingDisputeStatus.warning_closed;
  return BillingDisputeStatus.open;
}

function extractPaymentIntentId(dispute: StripeDisputeLike) {
  if (typeof dispute.payment_intent === "string") return dispute.payment_intent;
  if (typeof dispute.evidence_details === "object") {
    return null;
  }
  return null;
}

function extractChargeId(dispute: StripeDisputeLike) {
  if (typeof dispute.charge === "string") return dispute.charge;
  return dispute.charge?.id || null;
}

function extractCustomerId(dispute: StripeDisputeLike) {
  if (typeof dispute.charge === "string") return null;
  const customer = dispute.charge?.customer;
  if (typeof customer === "string") return customer;
  return customer?.id || null;
}

async function resolveDisputedResource(paymentIntentId: string | null) {
  if (!paymentIntentId) {
    return { resourceType: null, resourceId: null, userId: null, purchaserEmail: null };
  }

  const [retreatBooking, programmeEnrollment, giftPurchase] = await Promise.all([
    db.retreatBooking.findFirst({
      where: {
        OR: [
          { stripeDepositPaymentIntentId: paymentIntentId },
          { stripeBalancePaymentIntentId: paymentIntentId },
        ],
      },
      select: {
        id: true,
        purchaserUserId: true,
        attendeeUserId: true,
        purchaserEmail: true,
        attendeeEmail: true,
      },
    }),
    db.smallGroupProgrammeEnrollment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      select: { id: true, userId: true, attendeeEmail: true },
    }),
    db.giftPurchase.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      select: { id: true, purchaserUserId: true, purchaserEmail: true },
    }),
  ]);

  if (retreatBooking) {
    return {
      resourceType: "retreat_booking",
      resourceId: retreatBooking.id,
      userId: retreatBooking.purchaserUserId || retreatBooking.attendeeUserId || null,
      purchaserEmail: retreatBooking.purchaserEmail || retreatBooking.attendeeEmail || null,
    };
  }
  if (programmeEnrollment) {
    return {
      resourceType: "small_group_enrollment",
      resourceId: programmeEnrollment.id,
      userId: programmeEnrollment.userId || null,
      purchaserEmail: programmeEnrollment.attendeeEmail || null,
    };
  }
  if (giftPurchase) {
    return {
      resourceType: "gift_purchase",
      resourceId: giftPurchase.id,
      userId: giftPurchase.purchaserUserId || null,
      purchaserEmail: giftPurchase.purchaserEmail || null,
    };
  }

  return { resourceType: null, resourceId: null, userId: null, purchaserEmail: null };
}

export async function processStripeDisputeEvent(event: Stripe.Event) {
  const dispute = event.data.object as StripeDisputeLike;
  const paymentIntentId = extractPaymentIntentId(dispute);
  const chargeId = extractChargeId(dispute);
  const customerId = extractCustomerId(dispute);
  const resolved = await resolveDisputedResource(paymentIntentId);
  const userId =
    resolved.userId ||
    (customerId
      ? (
          await db.user.findUnique({
            where: { stripeCustomerId: customerId },
            select: { id: true },
          })
        )?.id || null
      : null);

  return db.billingDisputeCase.upsert({
    where: { stripeDisputeId: dispute.id },
    create: {
      stripeDisputeId: dispute.id,
      userId: userId || undefined,
      paymentIntentId: paymentIntentId || undefined,
      chargeId: chargeId || undefined,
      purchaserEmail: resolved.purchaserEmail || undefined,
      resourceType: resolved.resourceType || undefined,
      resourceId: resolved.resourceId || undefined,
      status: normalizeDisputeStatus(dispute.status),
      openedAt: new Date((dispute.created || Math.floor(Date.now() / 1000)) * 1000),
      closedAt:
        normalizeDisputeStatus(dispute.status) === BillingDisputeStatus.open ? null : new Date(),
      payloadJson: event as unknown as Prisma.JsonObject,
    },
    update: {
      userId: userId || undefined,
      paymentIntentId: paymentIntentId || undefined,
      chargeId: chargeId || undefined,
      purchaserEmail: resolved.purchaserEmail || undefined,
      resourceType: resolved.resourceType || undefined,
      resourceId: resolved.resourceId || undefined,
      status: normalizeDisputeStatus(dispute.status),
      closedAt:
        normalizeDisputeStatus(dispute.status) === BillingDisputeStatus.open ? null : new Date(),
      payloadJson: event as unknown as Prisma.JsonObject,
    },
  });
}

export async function hasActiveDisputeHold(resourceType: string, resourceId: string) {
  const state = await getDisputeHoldState({ resourceType, resourceId });
  return state.resourceBlocked;
}

export async function getDisputeHoldState(input: {
  userId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  purchaserEmail?: string | null;
}) {
  const [resourceDispute, userDispute] = await Promise.all([
    input.resourceType && input.resourceId
      ? db.billingDisputeCase.findFirst({
          where: {
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            status: BillingDisputeStatus.open,
          },
          orderBy: { openedAt: "desc" },
          select: {
            id: true,
            purchaserEmail: true,
          },
        })
      : Promise.resolve(null),
    input.userId
      ? db.billingDisputeCase.findFirst({
          where: {
            userId: input.userId,
            status: BillingDisputeStatus.open,
          },
          orderBy: { openedAt: "desc" },
          select: {
            id: true,
            purchaserEmail: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    resourceBlocked: Boolean(resourceDispute),
    userCheckoutBlocked: Boolean(userDispute),
    resourceDisputeId: resourceDispute?.id || null,
    userDisputeId: userDispute?.id || null,
    purchaserEmail:
      input.purchaserEmail ||
      resourceDispute?.purchaserEmail ||
      userDispute?.purchaserEmail ||
      null,
  };
}

export async function assertNoUserCheckoutDisputeHold(userId: string) {
  const state = await getDisputeHoldState({ userId });
  if (state.userCheckoutBlocked) {
    throw new Error("DISPUTE_HOLD");
  }
}

export async function assertNoResourceDisputeHold(resourceType: string, resourceId: string) {
  const state = await getDisputeHoldState({ resourceType, resourceId });
  if (state.resourceBlocked) {
    throw new Error("DISPUTE_HOLD");
  }
}

export async function getReplayDisputeHoldState(input: {
  enrollmentId: string;
  userId?: string | null;
}) {
  return getDisputeHoldState({
    resourceType: "small_group_enrollment",
    resourceId: input.enrollmentId,
    userId: input.userId || null,
  });
}

export async function listBillingDisputeCases() {
  return db.billingDisputeCase.findMany({
    orderBy: [{ openedAt: "desc" }],
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function updateBillingDisputeCase(input: {
  disputeId: string;
  actorUserId: string;
  status: BillingDisputeStatus;
  reason?: string | null;
}) {
  const existing = await db.billingDisputeCase.findUniqueOrThrow({
    where: { id: input.disputeId },
  });
  const updated = await db.billingDisputeCase.update({
    where: { id: input.disputeId },
    data: {
      status: input.status,
      closedAt: input.status === BillingDisputeStatus.open ? null : new Date(),
    },
  });
  await createAdminActionLog({
    actorUserId: input.actorUserId,
    actionType: "billing_dispute_updated",
    targetType: "billing_dispute",
    targetId: updated.id,
    reason: input.reason || null,
    oldValueJson: { status: existing.status },
    newValueJson: { status: updated.status },
  });
  return updated;
}
