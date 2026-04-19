import { apiOk, handleApiRoute, notFound, serviceUnavailable } from "@/lib/api/route";
import { resumeMembershipCancellation } from "@/lib/membership/membership-service";

export const POST = handleApiRoute(
  async ({ sessionUser }) => {
    try {
      const membership = await resumeMembershipCancellation(sessionUser!.id);
      return apiOk({ membership });
    } catch (error) {
      if (error instanceof Error && error.message === "MEMBERSHIP_NOT_FOUND") {
        throw notFound("Membership not found.");
      }
      if (error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED") {
        throw serviceUnavailable("Stripe is not configured.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
