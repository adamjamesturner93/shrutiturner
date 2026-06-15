import {
  apiOk,
  badRequest,
  handleApiRoute,
  notFound,
  parseJsonBody,
  serviceUnavailable,
} from "@/lib/api/route";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { scheduleCoachingCancellationAfterNextPayment } from "@/lib/billing/billing-service";

export const POST = handleApiRoute(
  async ({ request, requestId, requestIp, path, sessionUser }) => {
    const body = await parseJsonBody<{ userId?: unknown }>(request);
    if (typeof body.userId !== "string" || !body.userId.trim()) {
      throw badRequest("User id is required.");
    }

    try {
      const result = await scheduleCoachingCancellationAfterNextPayment(body.userId);
      await createAdminActionLog({
        actorUserId: sessionUser!.id,
        actionType: "coaching_subscription_cancellation_scheduled",
        targetType: "user",
        targetId: body.userId,
        requestId,
        requestPath: path,
        requestIp,
        newValueJson: result,
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
