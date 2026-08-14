import {
  apiOk,
  badRequest,
  handleApiRoute,
  notFound,
  parseJsonBody,
  serviceUnavailable,
} from "@/lib/api/route";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { stopCoachingRenewalAtCurrentPeriodEnd } from "@/lib/billing/billing-service";

export const POST = handleApiRoute(
  async ({ request, requestId, requestIp, path, sessionUser }) => {
    const body = await parseJsonBody<{ userId?: unknown; reason?: unknown }>(request);
    if (typeof body.userId !== "string" || !body.userId.trim()) {
      throw badRequest("User id is required.");
    }
    if (typeof body.reason !== "string" || body.reason.trim().length < 5) {
      throw badRequest("Add a short reason for the admin override.");
    }

    try {
      const result = await stopCoachingRenewalAtCurrentPeriodEnd(body.userId);
      await createAdminActionLog({
        actorUserId: sessionUser!.id,
        actionType: "coaching_subscription_future_payments_stopped",
        targetType: "user",
        targetId: body.userId,
        requestId,
        requestPath: path,
        requestIp,
        newValueJson: { ...result, reason: body.reason.trim().slice(0, 1000) },
      });
      return apiOk(result);
    } catch (error) {
      if (error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED") {
        throw serviceUnavailable("Stripe is not configured.");
      }
      if (error instanceof Error && error.message.startsWith("MISSING_STRIPE_PRICE:")) {
        throw serviceUnavailable("The coaching Stripe price is not configured yet.");
      }
      if (error instanceof Error && error.message === "COACHING_SUBSCRIPTION_NOT_FOUND") {
        throw notFound("No active coaching subscription was found for this client.");
      }
      throw error;
    }
  },
  { auth: "staff_admin" }
);
