import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { createMembershipCheckoutSession } from "@/lib/billing/billing-service";
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

    const result = await createMembershipCheckoutSession(
      user.id,
      "movewell",
      billingInterval,
      typeof body.promotionCode === "string" ? body.promotionCode : undefined,
      "movewell",
      {
        successPath: sanitizeRedirectPath(body.successPath),
        cancelPath: sanitizeRedirectPath(body.cancelPath),
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
    }
    console.error("POST /api/me/membership/checkout failed", error);
    return NextResponse.json({ message: "Failed to create checkout session" }, { status: 500 });
  }
}
