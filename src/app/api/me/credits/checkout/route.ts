import {
  apiOk,
  badRequest,
  conflict,
  handleApiRoute,
  parseJsonBody,
  serviceUnavailable,
  upstreamFailure,
} from "@/lib/api/route";
import { createCreditCheckoutSession } from "@/lib/billing/billing-service";
import { assertNoUserCheckoutDisputeHold } from "@/lib/billing/dispute-service";
import { sanitizeRedirectPath } from "@/lib/navigation/safe-redirect";

export const POST = handleApiRoute(
  async ({ request, sessionUser }) => {
    const body = await parseJsonBody<{
      bundleSize?: number;
      promotionCode?: string;
      successPath?: string;
      cancelPath?: string;
      bookingClassSlug?: string;
      bookingSessionId?: string;
    }>(request);
    const bundleSize = body.bundleSize;
    if (bundleSize !== 1 && bundleSize !== 3 && bundleSize !== 10) {
      throw badRequest("Invalid bundle size.");
    }

    await assertNoUserCheckoutDisputeHold(sessionUser!.id);

    try {
      const result = await createCreditCheckoutSession(
        sessionUser!.id,
        bundleSize,
        typeof body.promotionCode === "string" ? body.promotionCode : undefined,
        {
          successPath: sanitizeRedirectPath(body.successPath),
          cancelPath: sanitizeRedirectPath(body.cancelPath),
          bookingIntent: {
            classSlug:
              typeof body.bookingClassSlug === "string" ? body.bookingClassSlug : undefined,
            sessionId:
              typeof body.bookingSessionId === "string" ? body.bookingSessionId : undefined,
          },
        }
      );
      return apiOk(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.startsWith("MISSING_STRIPE_PRICE:")) {
          throw serviceUnavailable("Stripe price is not configured.");
        }
        if (error.message === "STRIPE_NOT_CONFIGURED") {
          throw serviceUnavailable("Stripe is not configured.");
        }
        if (error.message === "DISPUTE_HOLD") {
          throw conflict(
            "Checkout is temporarily blocked while an open payment dispute is under review."
          );
        }
      }
      throw upstreamFailure("Failed to create checkout session");
    }
  },
  { auth: "user" }
);
