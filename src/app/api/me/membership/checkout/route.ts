import { AcceptanceType } from "@prisma/client";
import {
  apiOk,
  badRequest,
  conflict,
  handleApiRoute,
  parseJsonBody,
  serviceUnavailable,
} from "@/lib/api/route";
import { createMembershipCheckoutSession } from "@/lib/billing/billing-service";
import { assertNoUserCheckoutDisputeHold } from "@/lib/billing/dispute-service";
import {
  buildMembershipDisclosure,
  SUBSCRIPTION_DISCLOSURE_VERSION,
} from "@/lib/billing/subscription-disclosure";
import { recordSubscriptionComplianceEvent } from "@/lib/billing/subscription-compliance";
import { getPublicPricing } from "@/lib/billing/public-pricing";
import {
  assertCurrentAcceptances,
  isAcceptanceRequiredError,
  recordAcceptanceEvent,
} from "@/lib/legal/acceptance-service";
import { sanitizeRedirectPath } from "@/lib/navigation/safe-redirect";

export const POST = handleApiRoute(
  async ({ request, sessionUser }) => {
    const body = await parseJsonBody<{
      plan?: string;
      billingInterval?: string;
      promotionCode?: string;
      successPath?: string;
      cancelPath?: string;
      disclosureVersion?: string;
      disclosureAccepted?: boolean;
    }>(request);
    const requestedPlan = typeof body.plan === "string" ? body.plan : "movewell";
    const billingInterval =
      body.billingInterval === "annual" || body.billingInterval === "monthly"
        ? body.billingInterval
        : "monthly";

    if (billingInterval !== "monthly" && billingInterval !== "annual") {
      throw badRequest("Invalid billing interval.");
    }

    if (requestedPlan !== "movewell") {
      throw badRequest("Invalid membership plan.");
    }

    if (body.disclosureAccepted !== true) {
      throw badRequest("Subscription terms must be acknowledged before checkout.");
    }

    if (body.disclosureVersion !== SUBSCRIPTION_DISCLOSURE_VERSION) {
      throw conflict("Subscription disclosure is out of date. Refresh and review it again.");
    }

    try {
      await assertNoUserCheckoutDisputeHold(sessionUser!.id);

      const acceptanceStates = await assertCurrentAcceptances(sessionUser!.id, [
        { type: AcceptanceType.terms, surface: "membership_checkout" },
        { type: AcceptanceType.health_waiver, surface: "membership_checkout" },
      ]);

      const disclosureAcceptedAt = new Date();
      const pricing = await getPublicPricing();
      const disclosureSnapshot = buildMembershipDisclosure(billingInterval, {
        monthlyPricePence: Math.round((pricing.membershipDisplay.movewellMonthly || 35) * 100),
        annualPricePence: Math.round((pricing.membershipDisplay.movewellAnnual || 350) * 100),
      });
      const immediateStartSummary =
        "Membership access begins immediately after checkout confirmation. If you use the service during a cooling-off period, any refund rights are subject to the immediate-start terms shown at checkout.";
      const immediateStartEvent = await recordAcceptanceEvent({
        userId: sessionUser!.id,
        actorUserId: sessionUser!.id,
        type: AcceptanceType.immediate_start,
        surface: "membership_checkout",
        metadataJson: {
          disclosureVersion: body.disclosureVersion,
          billingInterval,
          disclosureSnapshot,
          immediateStartSummary,
        },
      });
      await recordSubscriptionComplianceEvent({
        userId: sessionUser!.id,
        kind: "disclosure_acknowledged",
        status: "recorded",
        summary: `Subscription disclosure ${body.disclosureVersion} accepted for ${billingInterval} Move Well Membership checkout.`,
        metadataJson: {
          disclosureVersion: body.disclosureVersion,
          billingInterval,
          immediateStartAcceptanceEventId: immediateStartEvent.id,
          disclosureSnapshot,
        },
        eventAt: disclosureAcceptedAt,
      });

      const result = await createMembershipCheckoutSession(
        sessionUser!.id,
        "movewell",
        billingInterval,
        typeof body.promotionCode === "string" ? body.promotionCode : undefined,
        "movewell",
        {
          successPath: sanitizeRedirectPath(body.successPath),
          cancelPath: sanitizeRedirectPath(body.cancelPath),
          disclosureVersion: body.disclosureVersion,
          disclosureAcceptedAt,
          complianceSnapshot: {
            acceptanceStates: acceptanceStates.map((state) => ({
              type: state.type,
              policyVersionId: state.policyVersionId,
              acceptanceEventId: state.acceptanceEventId,
              version: state.currentVersion,
              surface: state.surface,
            })),
            immediateStartAcceptanceEventId: immediateStartEvent.id,
            subscriptionDisclosure: disclosureSnapshot,
            immediateStartSummary,
          },
          immediateStartSummary,
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
      if (isAcceptanceRequiredError(error)) {
        throw conflict(
          "Current legal acceptance is required before membership checkout.",
          error.details
        );
      }
      throw error;
    }
  },
  { auth: "user" }
);
