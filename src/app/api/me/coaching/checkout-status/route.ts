import { apiOk, badRequest, handleApiRoute, notFound } from "@/lib/api/route";
import { getCoachingCheckoutReturnState } from "@/lib/billing/billing-service";

export const GET = handleApiRoute(
  async ({ request, sessionUser }) => {
    const sessionId = new URL(request.url).searchParams.get("sessionId")?.trim();
    if (!sessionId) throw badRequest("Checkout session id is required.");
    try {
      return apiOk(await getCoachingCheckoutReturnState(sessionUser!.id, sessionId));
    } catch (error) {
      if (error instanceof Error && error.message === "COACHING_CHECKOUT_NOT_FOUND") {
        throw notFound("Coaching checkout was not found.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
