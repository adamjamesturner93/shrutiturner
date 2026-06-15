import {
  apiOk,
  badRequest,
  conflict,
  handleApiRoute,
  parseJsonBody,
  serviceUnavailable,
} from "@/lib/api/route";
import { createMembershipRefund } from "@/lib/billing/refund-service";

export const POST = handleApiRoute(
  async ({ request, requestId, requestIp, path, sessionUser }) => {
    const body = await parseJsonBody<{
      membershipId?: string;
      amountPence?: number;
      reason?: string;
      refundAsCredit?: boolean;
      creditAmount?: number;
    }>(request);

    if (!body.membershipId || !Number.isInteger(body.amountPence) || body.amountPence <= 0) {
      throw badRequest("Membership and refund amount are required.");
    }
    if (!body.reason?.trim()) {
      throw badRequest("Refund reason is required.");
    }
    if (
      body.refundAsCredit &&
      body.creditAmount !== undefined &&
      (!Number.isInteger(body.creditAmount) || body.creditAmount <= 0)
    ) {
      throw badRequest("Credit amount must be a positive whole number.");
    }

    try {
      const refund = await createMembershipRefund({
        membershipId: body.membershipId,
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
          error.message === "MEMBERSHIP_INVOICE_NOT_FOUND" ||
          error.message === "REFUND_AMOUNT_EXCEEDS_REMAINING"
        ) {
          throw conflict("That membership invoice is not refundable for the requested amount.");
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
