import {
  apiOk,
  badRequest,
  conflict,
  handleApiRoute,
  parseJsonBody,
  serviceUnavailable,
} from "@/lib/api/route";
import { createMembershipRefund, getMembershipRefundCapacity } from "@/lib/billing/refund-service";
import { db } from "@/lib/db";

export const GET = handleApiRoute(
  async () => {
    const memberships = await db.membershipSubscription.findMany({
      where: { latestInvoiceId: { not: null }, latestInvoiceAmountPence: { gt: 0 } },
      select: { id: true, user: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    const payments = await Promise.all(
      memberships.map(async (membership) => {
        const capacity = await getMembershipRefundCapacity(membership.id);
        return {
          membershipId: membership.id,
          label: membership.user.name || membership.user.email,
          invoiceId: capacity.membership?.latestInvoiceId,
          paidPence: capacity.membership?.latestInvoiceAmountPence,
          refundablePence: capacity.refundablePence,
        };
      })
    );
    return apiOk(payments, { headers: { "Cache-Control": "private, no-store" } });
  },
  { auth: "owner_admin" }
);

export const POST = handleApiRoute(
  async ({ request, requestId, requestIp, path, sessionUser }) => {
    const body = await parseJsonBody<{
      membershipId?: string;
      amountPence?: number;
      reason?: string;
      refundAsCredit?: boolean;
      creditAmount?: number;
      idempotencyKey?: string;
      expectedInvoiceId?: string;
    }>(request);

    if (!body.membershipId || !Number.isInteger(body.amountPence) || body.amountPence <= 0) {
      throw badRequest("Membership and refund amount are required.");
    }
    if (!body.reason?.trim()) {
      throw badRequest("Refund reason is required.");
    }
    if (!/^[\w-]{16,100}$/.test(body.idempotencyKey || "") || !body.expectedInvoiceId) {
      throw badRequest("Review the selected invoice before confirming the refund.");
    }
    if (
      body.refundAsCredit &&
      (!Number.isInteger(body.creditAmount) || body.creditAmount <= 0)
    ) {
      throw badRequest("Credit amount must be a positive whole number.");
    }

    try {
      const refund = await createMembershipRefund({
        membershipId: body.membershipId,
        idempotencyKey: body.idempotencyKey,
        expectedInvoiceId: body.expectedInvoiceId,
        amountPence: body.amountPence,
        reason: body.reason,
        refundAsCredit: body.refundAsCredit,
        creditAmount: body.creditAmount,
        actorUserId: sessionUser!.id,
        requestId,
        requestPath: path,
        requestIp,
      });
      return apiOk(refund);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "REFUND_PREVIEW_STALE" ||
          error.message === "REFUND_KEY_CONFLICT" ||
          error.message === "MEMBERSHIP_INVOICE_NOT_FOUND" ||
          error.message === "REFUND_AMOUNT_EXCEEDS_REMAINING"
        ) {
          throw conflict("That membership invoice is not refundable for the requested amount.");
        }
        if (
          error.message === "REFUND_RECONCILIATION_REQUIRED" ||
          error.message === "MISSING_PAYMENT_INTENT"
        ) {
          throw conflict(
            "This invoice needs a provider reconciliation before another refund. No new refund was sent."
          );
        }
        if (error.message === "STRIPE_NOT_CONFIGURED") {
          throw serviceUnavailable("Stripe is not configured.");
        }
      }
      throw error;
    }
  },
  { auth: "owner_admin" }
);
