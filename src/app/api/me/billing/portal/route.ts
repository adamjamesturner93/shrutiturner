import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { createBillingPortalSession } from "@/lib/billing/billing-service";
import { sanitizeRedirectPath } from "@/lib/navigation/safe-redirect";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json().catch(() => ({}))) as {
      returnPath?: string;
    };

    const result = await createBillingPortalSession(user.id, {
      returnPath: sanitizeRedirectPath(body.returnPath) || "/dashboard/membership",
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "STRIPE_NOT_CONFIGURED") {
        return NextResponse.json({ message: "Stripe is not configured." }, { status: 501 });
      }
    }
    console.error("POST /api/me/billing/portal failed", error);
    return NextResponse.json({ message: "Failed to open billing portal" }, { status: 500 });
  }
}
