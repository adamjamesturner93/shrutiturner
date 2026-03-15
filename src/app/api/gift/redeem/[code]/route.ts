import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGiftRedemptionState, redeemGiftPurchase } from "@/lib/gifts/service";

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
    console.error("POST /api/gift/redeem/[code] failed", error);
    return NextResponse.json({ message: "Failed to redeem gift." }, { status: 500 });
  }
}
