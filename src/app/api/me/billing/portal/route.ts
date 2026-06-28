import {
  apiOk,
  handleApiRoute,
  parseJsonBody,
  serviceUnavailable,
  upstreamFailure,
} from "@/lib/api/route";
import { createBillingPortalSession } from "@/lib/billing/billing-service";
import { sanitizeRedirectPath } from "@/lib/navigation/safe-redirect";

export const POST = handleApiRoute(
  async ({ request, sessionUser }) => {
    const body = await parseJsonBody<{
      returnPath?: string;
    }>(request);

    try {
      const result = await createBillingPortalSession(sessionUser!.id, {
        returnPath: sanitizeRedirectPath(body.returnPath) || "/dashboard/coaching",
      });
      return apiOk(result);
    } catch (error) {
      if (error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED") {
        throw serviceUnavailable("Stripe is not configured.");
      }
      throw upstreamFailure("Failed to open billing portal");
    }
  },
  { auth: "user" }
);
