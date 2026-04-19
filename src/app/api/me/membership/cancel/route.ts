import { apiOk, handleApiRoute, serviceUnavailable } from "@/lib/api/route";
import { cancelMembership } from "@/lib/membership/membership-service";

export const POST = handleApiRoute(
  async ({ sessionUser }) => {
    try {
      const membership = await cancelMembership(sessionUser!.id);
      return apiOk({ membership });
    } catch (error) {
      if (error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED") {
        throw serviceUnavailable("Stripe is not configured.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
