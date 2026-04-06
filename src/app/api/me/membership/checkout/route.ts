import { AcceptanceType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { createMembershipCheckoutSession } from "@/lib/billing/billing-service";
import { assertNoUserCheckoutDisputeHold } from "@/lib/billing/dispute-service";
import { SUBSCRIPTION_DISCLOSURE_VERSION } from "@/lib/billing/subscription-disclosure";
import { recordSubscriptionComplianceEvent } from "@/lib/billing/subscription-compliance";
import {
  assertCurrentAcceptances,
  isAcceptanceRequiredError,
  recordAcceptanceEvent,
} from "@/lib/legal/acceptance-service";
import { sanitizeRedirectPath } from "@/lib/navigation/safe-redirect";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json().catch(() => ({}))) as {
      plan?: string;
      billingInterval?: string;
      promotionCode?: string;
      successPath?: string;
      cancelPath?: string;
      disclosureVersion?: string;
      disclosureAccepted?: boolean;
    };
    const requestedPlan = typeof body.plan === "string" ? body.plan : "movewell";
    const billingInterval =
      body.billingInterval === "annual" || body.billingInterval === "monthly"
        ? body.billingInterval
        : "monthly";

    if (billingInterval !== "monthly" && billingInterval !== "annual") {
      return NextResponse.json({ message: "Invalid billing interval." }, { status: 400 });
    }

    if (requestedPlan !== "movewell") {
      return NextResponse.json({ message: "Invalid membership plan." }, { status: 400 });
    }

    await assertNoUserCheckoutDisputeHold(user.id);

    const acceptanceStates = await assertCurrentAcceptances(user.id, [
      { type: AcceptanceType.terms, surface: "membership_checkout" },
      { type: AcceptanceType.health_waiver, surface: "membership_checkout" },
    ]);

    if (body.disclosureAccepted !== true) {
      return NextResponse.json(
        { message: "Subscription terms must be acknowledged before checkout." },
        { status: 400 }
      );
    }

    if (body.disclosureVersion !== SUBSCRIPTION_DISCLOSURE_VERSION) {
      return NextResponse.json(
        { message: "Subscription disclosure is out of date. Refresh and review it again." },
        { status: 409 }
      );
    }

    const disclosureAcceptedAt = new Date();
    const immediateStartEvent = await recordAcceptanceEvent({
      userId: user.id,
      actorUserId: user.id,
      type: AcceptanceType.immediate_start,
      surface: "membership_checkout",
      metadataJson: {
        disclosureVersion: body.disclosureVersion,
        billingInterval,
      },
    });
    await recordSubscriptionComplianceEvent({
      userId: user.id,
      kind: "disclosure_acknowledged",
      status: "recorded",
      summary: `Subscription disclosure ${body.disclosureVersion} accepted for ${billingInterval} Move Well Membership checkout.`,
      metadataJson: {
        disclosureVersion: body.disclosureVersion,
        billingInterval,
        immediateStartAcceptanceEventId: immediateStartEvent.id,
      },
      eventAt: disclosureAcceptedAt,
    });

    const result = await createMembershipCheckoutSession(
      user.id,
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
        },
      }
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("MISSING_STRIPE_PRICE:")) {
        return NextResponse.json({ message: "Stripe price is not configured." }, { status: 501 });
      }
      if (error.message === "STRIPE_NOT_CONFIGURED") {
        return NextResponse.json({ message: "Stripe is not configured." }, { status: 501 });
      }
      if (error.message === "DISPUTE_HOLD") {
        return NextResponse.json(
          {
            message:
              "Checkout is temporarily blocked while an open payment dispute is under review.",
          },
          { status: 409 }
        );
      }
    }
    if (isAcceptanceRequiredError(error)) {
      return NextResponse.json(error.details, { status: 409 });
    }
    console.error("POST /api/me/membership/checkout failed", error);
    return NextResponse.json({ message: "Failed to create checkout session" }, { status: 500 });
  }
}
