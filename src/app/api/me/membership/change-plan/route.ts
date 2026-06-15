import {
  apiOk,
  badRequest,
  conflict,
  handleApiRoute,
  parseJsonBody,
  serviceUnavailable,
} from "@/lib/api/route";
import { changeMembershipPlan } from "@/lib/membership/membership-service";

export const POST = handleApiRoute(
  async ({ request, sessionUser }) => {
    try {
      const body = await parseJsonBody<{
        plan?: string;
        billingInterval?: string;
      }>(request);
      const plan = body.plan;
      const billingInterval =
        body.billingInterval === "annual" || body.billingInterval === "monthly"
          ? body.billingInterval
          : null;

      if (plan !== "movewell") {
        throw badRequest("Invalid plan.");
      }

      if (!billingInterval) {
        throw badRequest("Invalid billing interval.");
      }

      const result = await changeMembershipPlan({
        userId: sessionUser!.id,
        plan,
        billingInterval,
      });
      return apiOk(result);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === "STRIPE_NOT_CONFIGURED" ||
          error.message === "STRIPE_SUBSCRIPTION_NOT_FOUND" ||
          error.message === "STRIPE_PRICE_NOT_CONFIGURED")
      ) {
        throw serviceUnavailable("Stripe subscription management is not configured.");
      }
      if (
        error instanceof Error &&
        (error.message === "MEMBERSHIP_NOT_FOUND" || error.message === "MEMBERSHIP_NOT_ACTIVE")
      ) {
        throw conflict("No active membership is available to change.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
