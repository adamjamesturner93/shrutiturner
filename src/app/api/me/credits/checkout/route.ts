import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { createCreditCheckoutSession } from "@/lib/billing/billing-service";
import { sanitizeRedirectPath } from "@/lib/navigation/safe-redirect";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json().catch(() => ({}))) as {
      bundleSize?: number;
      promotionCode?: string;
      successPath?: string;
      cancelPath?: string;
    };
    const bundleSize = body.bundleSize;
    if (bundleSize !== 1 && bundleSize !== 3 && bundleSize !== 10) {
      return NextResponse.json({ message: "Invalid bundle size." }, { status: 400 });
    }

    const result = await createCreditCheckoutSession(
      user.id,
      bundleSize,
      typeof body.promotionCode === "string" ? body.promotionCode : undefined,
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
    console.error("POST /api/me/credits/checkout failed", error);
    return NextResponse.json({ message: "Failed to create checkout session" }, { status: 500 });
  }
}
