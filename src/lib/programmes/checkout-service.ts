import "server-only";
import { z } from "zod";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { assertNoUserCheckoutDisputeHold } from "@/lib/billing/dispute-service";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { loadCohort, requireCohortStaff } from "./access";
import { salesOpen } from "./policy";
import { programmeNow } from "./clock";
import { createAdminActionLog } from "@/lib/admin/action-log-service";

const identity = z.object({
  name: z.string().trim().min(1).max(160),
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase()),
});
export const purchaseSchema = z.object({
  purchaser: identity,
  participant: identity,
  agreementVersion: z.string(),
  acceptedTerms: z.literal(true),
  screeningAcknowledged: z.literal(true),
});
export async function createProgrammeCheckout(cohortId: string, raw: unknown, actorId?: string) {
  const input = purchaseSchema.parse(raw);
  if (actorId) await assertNoUserCheckoutDisputeHold(actorId);
  const c = await loadCohort(cohortId);
  const now = programmeNow();
  const enrolment = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "SmallGroupProgramme" WHERE id = ${c.id} FOR UPDATE`;
    const cohort = await tx.smallGroupProgramme.findUniqueOrThrow({ where: { id: c.id } });
    if (
      cohort.publicVisibility !== "listed" ||
      !salesOpen(cohort, now) ||
      !cohort.salePricePence ||
      !cohort.maximumParticipants
    )
      throw new Error("ENROLMENT_CLOSED");
    if (input.agreementVersion !== cohort.agreementVersion) throw new Error("AGREEMENT_CHANGED");
    const duplicate = await tx.smallGroupProgrammeEnrollment.findFirst({
      where: {
        programmeId: c.id,
        attendeeEmail: input.participant.email,
        OR: [
          { status: "active" },
          { status: "pending_payment", paymentWindowExpiresAt: { gt: now } },
        ],
      },
    });
    if (duplicate) throw new Error("ALREADY_ENROLLED_OR_RESERVED");
    const reserved = await tx.smallGroupProgrammeEnrollment.count({
      where: {
        programmeId: c.id,
        OR: [
          { status: "active" },
          { status: "pending_payment", paymentWindowExpiresAt: { gt: now } },
        ],
      },
    });
    if (reserved >= cohort.maximumParticipants) throw new Error("COHORT_FULL");
    return tx.smallGroupProgrammeEnrollment.create({
      data: {
        programmeId: c.id,
        purchaserEmail: input.purchaser.email,
        attendeeEmail: input.participant.email,
        attendeeName: input.participant.name,
        status: "pending_payment",
        pricePaidPence: cohort.salePricePence,
        paymentWindowExpiresAt: new Date(now.getTime() + 30 * 60000),
        complianceSnapshotJson: {
          agreementVersion: input.agreementVersion,
          acceptedTerms: true,
          screeningAcknowledged: true,
          refundWording: cohort.refundWording,
          acceptedAt: now.toISOString(),
        },
      },
    });
  });
  try {
    const session = await getStripeClient().checkout.sessions.create(
      {
        mode: "payment",
        customer_email: input.purchaser.email,
        billing_address_collection: "required",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "gbp",
              unit_amount: enrolment.pricePaidPence!,
              product_data: { name: c.title },
            },
          },
        ],
        metadata: { kind: "cohort_purchase", enrolmentId: enrolment.id },
        success_url: buildAbsoluteUrl(
          `/programmes/checkout/success?session_id={CHECKOUT_SESSION_ID}`
        ),
        cancel_url: buildAbsoluteUrl(`/programmes/${c.runSlug}?checkout=cancelled`),
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      },
      { idempotencyKey: `cohort-checkout:${enrolment.id}` }
    );
    await db.smallGroupProgrammeEnrollment.update({
      where: { id: enrolment.id },
      data: { stripeCheckoutSessionId: session.id },
    });
    return { checkoutUrl: session.url, enrolmentId: enrolment.id };
  } catch (error) {
    await db.smallGroupProgrammeEnrollment.update({
      where: { id: enrolment.id },
      data: { status: "cancelled", paymentWindowExpiresAt: null },
    });
    throw error;
  }
}
export async function fulfilProgrammeCheckout(session: Stripe.Checkout.Session) {
  if (session.metadata?.kind !== "cohort_purchase") return false;
  if (session.payment_status !== "paid") return true;
  const id = session.metadata.enrolmentId;
  if (!id) throw new Error("INVALID_CHECKOUT");
  await db.$transaction(async (tx) => {
    const initial = await tx.smallGroupProgrammeEnrollment.findUniqueOrThrow({ where: { id } });
    await tx.$queryRaw`SELECT id FROM "SmallGroupProgramme" WHERE id = ${initial.programmeId} FOR UPDATE`;
    const e = await tx.smallGroupProgrammeEnrollment.findUniqueOrThrow({ where: { id } });
    if (e.stripeCheckoutSessionId && e.stripeCheckoutSessionId !== session.id)
      throw new Error("INVALID_CHECKOUT");
    if (session.amount_total !== e.pricePaidPence || session.currency?.toLowerCase() !== "gbp")
      throw new Error("PAYMENT_AMOUNT_MISMATCH");
    if (e.paidAt) return;
    const c = await tx.smallGroupProgramme.findUniqueOrThrow({ where: { id: e.programmeId } });
    const now = programmeNow();
    const other = await tx.smallGroupProgrammeEnrollment.count({
      where: {
        programmeId: c.id,
        id: { not: id },
        OR: [
          { status: "active" },
          { status: "pending_payment", paymentWindowExpiresAt: { gt: now } },
        ],
      },
    });
    const duplicate = await tx.smallGroupProgrammeEnrollment.count({
      where: {
        programmeId: c.id,
        attendeeEmail: e.attendeeEmail,
        id: { not: id },
        status: "active",
      },
    });
    const unavailable =
      duplicate > 0 ||
      !["on_sale", "confirmed"].includes(c.cohortState || "") ||
      !c.startDate ||
      now >= c.startDate ||
      other >= (c.maximumParticipants || 0);
    const existing = await tx.user.findUnique({ where: { email: e.attendeeEmail } });
    if (existing?.deletedAt) throw new Error("ACCOUNT_UNAVAILABLE");
    const user =
      existing ||
      (await tx.user.create({
        data: {
          email: e.attendeeEmail,
          name: e.attendeeName,
          firstName: e.attendeeName.split(" ")[0],
          lastName: e.attendeeName.split(" ").slice(1).join(" "),
          role: "student",
        },
      }));
    await tx.smallGroupProgrammeEnrollment.update({
      where: { id },
      data: {
        userId: user.id,
        status: unavailable ? "cancelled" : "active",
        paidAt: now,
        paymentWindowExpiresAt: null,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
        refundStatus: unavailable ? "pending" : null,
      },
    });
    await tx.offeringClearance.upsert({
      where: { userId_offeringKey: { userId: user.id, offeringKey: `programme:${c.id}` } },
      create: { userId: user.id, programmeId: c.id, offeringKey: `programme:${c.id}` },
      update: {},
    });
    await tx.programmeMessage.upsert({
      where: { sourceKey: `${unavailable ? "cancelled" : "welcome"}:${id}` },
      create: {
        programmeId: c.id,
        userId: user.id,
        kind: unavailable ? "cancelled" : "welcome",
        sourceKey: `${unavailable ? "cancelled" : "welcome"}:${id}`,
        dueAt: now,
      },
      update: {},
    });
  });
  const enrolment = await db.smallGroupProgrammeEnrollment.findUnique({
    where: { id },
    select: { programmeId: true },
  });
  if (enrolment) {
    const { dispatchProgrammeMessages } = await import("./jobs");
    await dispatchProgrammeMessages(enrolment.programmeId).catch(() => undefined);
  }
  return true;
}
export async function cancelProgramme(actorId: string, cohortId: string, reason: string) {
  const c = await requireCohortStaff(actorId, cohortId);
  if (!reason.trim()) throw new Error("REASON_REQUIRED");
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "SmallGroupProgramme" WHERE id = ${c.id} FOR UPDATE`;
    await tx.smallGroupProgramme.update({
      where: { id: c.id },
      data: { cohortState: "cancelled", enrolmentOpen: false },
    });
    const enrolled = await tx.smallGroupProgrammeEnrollment.findMany({
      where: { programmeId: c.id },
    });
    for (const e of enrolled) {
      await tx.smallGroupProgrammeEnrollment.update({
        where: { id: e.id },
        data: {
          status: "cancelled",
          paymentWindowExpiresAt: null,
          ...(e.paidAt && e.refundedPence < (e.pricePaidPence || 0)
            ? { refundStatus: e.refundStatus === "succeeded" ? "succeeded" : "pending" }
            : {}),
        },
      });
      if (e.paidAt && e.userId)
        await tx.programmeMessage.upsert({
          where: { sourceKey: `cancelled:${e.id}` },
          create: {
            sourceKey: `cancelled:${e.id}`,
            kind: "cancelled",
            programmeId: c.id,
            userId: e.userId,
            dueAt: programmeNow(),
          },
          update: {},
        });
    }
    await tx.programmeMessage.updateMany({
      where: { programmeId: c.id, sentAt: null, kind: { notIn: ["cancelled", "refunded"] } },
      data: { sentAt: programmeNow(), error: "suppressed:cancelled" },
    });
    await createAdminActionLog(
      {
        actorUserId: actorId,
        actionType: "programme_cancelled",
        targetType: "programme",
        targetId: c.id,
        reason,
      },
      tx
    );
  });
}
export async function refundProgrammeEnrolment(actorId: string, cohortId: string, id: string) {
  const c = await requireCohortStaff(actorId, cohortId);
  const e = await db.smallGroupProgrammeEnrollment.findFirst({
    where: { id, programmeId: c.id, status: "cancelled", paidAt: { not: null } },
  });
  if (!e?.stripePaymentIntentId || !e.pricePaidPence) throw new Error("REFUND_UNAVAILABLE");
  if (e.refundStatus === "succeeded") return { status: "succeeded" };
  try {
    const refund = await getStripeClient().refunds.create(
      { payment_intent: e.stripePaymentIntentId, amount: e.pricePaidPence - e.refundedPence },
      {
        idempotencyKey: `cohort-refund:${e.id}${e.refundStatus === "failed" && e.refundId ? `:retry:${e.refundId}` : ""}`,
      }
    );
    await db.smallGroupProgrammeEnrollment.update({
      where: { id },
      data: {
        refundStatus: refund.status === "succeeded" ? "succeeded" : "pending",
        refundId: refund.id,
        refundedPence: refund.status === "succeeded" ? e.pricePaidPence : e.refundedPence,
        refundError: null,
      },
    });
    await reconcileProgrammeRefund(refund);
    await createAdminActionLog({
      actorUserId: actorId,
      actionType: "programme_refunded",
      targetType: "programme_enrolment",
      targetId: id,
      newValueJson: { refundId: refund.id, status: refund.status },
    });
    return { status: refund.status };
  } catch (error) {
    await db.smallGroupProgrammeEnrollment.update({
      where: { id },
      data: { refundStatus: "failed", refundError: "Refund needs retry or reconciliation" },
    });
    throw error;
  }
}

/** Stripe may finish a refund asynchronously; keep the auditable enrolment in sync. */
export async function reconcileProgrammeRefund(refund: Stripe.Refund) {
  const e = await db.smallGroupProgrammeEnrollment.findFirst({
    where: { refundId: refund.id },
    include: { programme: true },
  });
  if (!e || !e.programme.cohortState) return false;
  const succeeded = refund.status === "succeeded";
  await db.$transaction(async (tx) => {
    await tx.smallGroupProgrammeEnrollment.update({
      where: { id: e.id },
      data: {
        refundStatus: succeeded
          ? "succeeded"
          : ["failed", "canceled"].includes(refund.status || "")
            ? "failed"
            : "pending",
        refundedPence: succeeded ? Math.max(e.refundedPence, refund.amount || 0) : e.refundedPence,
        refundError: ["failed", "canceled"].includes(refund.status || "")
          ? "Refund requires review or retry"
          : null,
      },
    });
    if (succeeded && e.userId)
      await tx.programmeMessage.upsert({
        where: { sourceKey: `refunded:${e.id}` },
        create: {
          sourceKey: `refunded:${e.id}`,
          programmeId: e.programmeId,
          userId: e.userId,
          kind: "refunded",
          dueAt: programmeNow(),
        },
        update: {},
      });
  });
  return true;
}
