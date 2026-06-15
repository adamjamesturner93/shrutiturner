import { apiOk, handleApiRoute, notFound, serviceUnavailable } from "@/lib/api/route";
import { scheduleCoachingCancellationAfterNextPayment } from "@/lib/billing/billing-service";

export const POST = handleApiRoute(
  async ({ sessionUser }) => {
    try {
      const result = await scheduleCoachingCancellationAfterNextPayment(sessionUser!.id);
      return apiOk(result);
    } catch (error) {
      if (error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED") {
        throw serviceUnavailable("Stripe is not configured.");
      }
      if (error instanceof Error && error.message.startsWith("MISSING_STRIPE_PRICE:")) {
        throw serviceUnavailable("The coaching Stripe price is not configured yet.");
      }
      if (error instanceof Error && error.message === "COACHING_SUBSCRIPTION_NOT_FOUND") {
        throw notFound("No active coaching subscription was found.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
