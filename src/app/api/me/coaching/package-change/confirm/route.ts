import { AcceptanceType } from "@prisma/client";
import {
  apiOk,
  conflict,
  handleApiRoute,
  notFound,
  parseJsonBody,
  serviceUnavailable,
} from "@/lib/api/route";
import { confirmCoachingPackageChangeRequest } from "@/lib/billing/billing-service";
import {
  assertCurrentAcceptances,
  isAcceptanceRequiredError,
} from "@/lib/legal/acceptance-service";

type Body = {
  packageChangeRequestId?: unknown;
};

export const POST = handleApiRoute(
  async ({ request, sessionUser }) => {
    const body = await parseJsonBody<Body>(request);
    if (typeof body.packageChangeRequestId !== "string") {
      throw conflict("Package change request id is required.");
    }

    try {
      await assertCurrentAcceptances(sessionUser!.id, [
        { type: AcceptanceType.terms, surface: "coaching_package_change" },
        { type: AcceptanceType.health_waiver, surface: "coaching_package_change" },
        { type: AcceptanceType.coaching_agreement, surface: "coaching_package_change" },
      ]);

      const result = await confirmCoachingPackageChangeRequest(
        sessionUser!.id,
        body.packageChangeRequestId
      );
      return apiOk(result);
    } catch (error) {
      if (isAcceptanceRequiredError(error)) {
        throw conflict("Current legal acceptance is required before updating your coaching plan.", {
          requiredAcceptances: error.details.requiredAcceptances,
        });
      }
      if (error instanceof Error && error.message === "COACHING_PACKAGE_CHANGE_NOT_FOUND") {
        throw notFound("No pending coaching plan update was found.");
      }
      if (error instanceof Error && error.message === "COACHING_SUBSCRIPTION_NOT_FOUND") {
        throw conflict("No active coaching subscription was found for this plan update.");
      }
      if (error instanceof Error && error.message === "COACHING_PAID_START_NOT_AVAILABLE") {
        throw conflict("Paid coaching billing has already been configured for this client.");
      }
      if (error instanceof Error && error.message === "COACHING_OFFER_RETIRED") {
        throw conflict("This coaching offer is no longer available. Please contact Shruti.");
      }
      if (error instanceof Error && error.message.startsWith("MISSING_STRIPE_PRICE:")) {
        throw serviceUnavailable("The coaching Stripe price is not configured yet.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
