import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGiftRedemptionState, redeemGiftPurchase } from "@/lib/gifts/service";
import { isAcceptanceRequiredError } from "@/lib/legal/acceptance-service";

type RedeemBody = {
  attendeeFirstName?: unknown;
  attendeeLastName?: unknown;
  attendeeEmail?: unknown;
  phone?: unknown;
  emergencyContactName?: unknown;
  emergencyContactPhone?: unknown;
  dietaryRequirements?: unknown;
  medicalConditions?: unknown;
  mobilityNeeds?: unknown;
  guestTwoFirstName?: unknown;
  guestTwoLastName?: unknown;
  guestTwoEmail?: unknown;
  guestTwoDietaryRequirements?: unknown;
};

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const state = await getGiftRedemptionState(code);
  return NextResponse.json(state);
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { code } = await context.params;
  const body = (await request.json().catch(() => null)) as RedeemBody | null;
  if (!body) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    const result = await redeemGiftPurchase({
      code,
      userId: session.user.id,
      attendeeFirstName: typeof body.attendeeFirstName === "string" ? body.attendeeFirstName : "",
      attendeeLastName: typeof body.attendeeLastName === "string" ? body.attendeeLastName : "",
      attendeeEmail: typeof body.attendeeEmail === "string" ? body.attendeeEmail : "",
      phone: typeof body.phone === "string" ? body.phone : "",
      emergencyContactName:
        typeof body.emergencyContactName === "string" ? body.emergencyContactName : "",
      emergencyContactPhone:
        typeof body.emergencyContactPhone === "string" ? body.emergencyContactPhone : "",
      dietaryRequirements:
        typeof body.dietaryRequirements === "string" ? body.dietaryRequirements : "",
      medicalConditions: typeof body.medicalConditions === "string" ? body.medicalConditions : "",
      mobilityNeeds: typeof body.mobilityNeeds === "string" ? body.mobilityNeeds : "",
      guestTwoFirstName: typeof body.guestTwoFirstName === "string" ? body.guestTwoFirstName : "",
      guestTwoLastName: typeof body.guestTwoLastName === "string" ? body.guestTwoLastName : "",
      guestTwoEmail: typeof body.guestTwoEmail === "string" ? body.guestTwoEmail : "",
      guestTwoDietaryRequirements:
        typeof body.guestTwoDietaryRequirements === "string"
          ? body.guestTwoDietaryRequirements
          : "",
    });
    return NextResponse.json(result);
  } catch (error) {
    if (isAcceptanceRequiredError(error)) {
      return NextResponse.json(error.details, { status: 409 });
    }
    if (error instanceof Error && error.message === "WORKSHOP_SETUP_REQUIRED") {
      return NextResponse.json(
        {
          code: "WORKSHOP_SETUP_REQUIRED",
          message: "Complete your workshop setup before redeeming this gift.",
          setupUrl: `/gift/redeem/${code}/setup`,
        },
        { status: 409 }
      );
    }
    if (
      error instanceof Error &&
      [
        "INVALID_GIFT",
        "ALREADY_REDEEMED",
        "GIFT_NOT_READY",
        "GIFT_EXPIRED",
        "ATTENDEE_REQUIRED",
        "SECOND_GUEST_REQUIRED",
      ].includes(error.message)
    ) {
      return NextResponse.json(
        { message: "This gift cannot be redeemed with the details provided." },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "DISPUTE_HOLD") {
      return NextResponse.json(
        {
          message:
            "This gift is temporarily blocked while an open payment dispute is under review.",
        },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "RECIPIENT_EMAIL_MISMATCH") {
      return NextResponse.json(
        {
          code: "RECIPIENT_EMAIL_MISMATCH",
          message:
            "This gift was addressed to a different email. Sign in with the recipient email or contact support to have it corrected.",
          supportUrl: "/contact",
        },
        { status: 403 }
      );
    }
    console.error("POST /api/gift/redeem/[code] failed", error);
    return NextResponse.json({ message: "Failed to redeem gift." }, { status: 500 });
  }
}
