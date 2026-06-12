import { NextResponse } from "next/server";
import { AcceptanceType } from "@prisma/client";
import { requireSessionUser } from "@/lib/api/auth-user";
import { createCoachingCheckoutSession } from "@/lib/billing/billing-service";
import {
  assertCurrentAcceptances,
  isAcceptanceRequiredError,
} from "@/lib/legal/acceptance-service";

type Body = {
  applicationId?: unknown;
};

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json().catch(() => null)) as Body | null;
    if (!body || typeof body.applicationId !== "string") {
      return NextResponse.json({ message: "Application id is required." }, { status: 400 });
    }

    await assertCurrentAcceptances(user.id, [
      { type: AcceptanceType.terms, surface: "coaching_checkout" },
      { type: AcceptanceType.health_waiver, surface: "coaching_checkout" },
    ]);

    const checkout = await createCoachingCheckoutSession(user.id, body.applicationId, {
      successPath: "/dashboard/coaching?checkout=success",
      cancelPath: "/dashboard/coaching?checkout=cancelled",
    });

    return NextResponse.json(checkout);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "COACHING_APPLICATION_NOT_APPROVED") {
      return NextResponse.json(
        { message: "This coaching application is not ready for payment yet." },
        { status: 409 }
      );
    }
    if (isAcceptanceRequiredError(error)) {
      return NextResponse.json(
        {
          message: "Current legal acceptance is required before coaching checkout.",
          details: error.details,
        },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message.startsWith("MISSING_STRIPE_PRICE:")) {
      return NextResponse.json(
        { message: "The coaching Stripe price is not configured yet." },
        { status: 503 }
      );
    }
    console.error("POST /api/me/coaching/checkout failed", error);
    return NextResponse.json({ message: "Failed to start coaching checkout." }, { status: 500 });
  }
}
