import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAcceptanceRequiredError } from "@/lib/legal/acceptance-service";
import { createRetreatCheckout } from "@/lib/retreats/service";

type RetreatCheckoutBody = {
  retreatDateId?: unknown;
  roomOptionId?: unknown;
  purchaseMode?: unknown;
  purchaserFirstName?: unknown;
  purchaserLastName?: unknown;
  purchaserEmail?: unknown;
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
  acceptedTermsVersion?: unknown;
  acceptedHealthWaiverVersion?: unknown;
  acceptedHealthDataVersion?: unknown;
  recipientFirstName?: unknown;
  recipientLastName?: unknown;
  recipientEmail?: unknown;
  recipientMessage?: unknown;
  deliveryTarget?: unknown;
};

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = (await request.json().catch(() => null)) as RetreatCheckoutBody | null;
  if (!body) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const session = await auth();

  try {
    const result = await createRetreatCheckout({
      retreatSlug: slug,
      retreatDateId: typeof body.retreatDateId === "string" ? body.retreatDateId : "",
      roomOptionId: typeof body.roomOptionId === "string" ? body.roomOptionId : "",
      purchaseMode: body.purchaseMode === "gift" ? "gift" : "self",
      purchaserUserId: session?.user?.id || null,
      purchaserFirstName:
        typeof body.purchaserFirstName === "string" ? body.purchaserFirstName : "",
      purchaserLastName: typeof body.purchaserLastName === "string" ? body.purchaserLastName : "",
      purchaserEmail: typeof body.purchaserEmail === "string" ? body.purchaserEmail : "",
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
      acceptedTermsVersion:
        typeof body.acceptedTermsVersion === "string" ? body.acceptedTermsVersion : null,
      acceptedHealthWaiverVersion:
        typeof body.acceptedHealthWaiverVersion === "string"
          ? body.acceptedHealthWaiverVersion
          : null,
      acceptedHealthDataVersion:
        typeof body.acceptedHealthDataVersion === "string" ? body.acceptedHealthDataVersion : null,
      recipientFirstName:
        typeof body.recipientFirstName === "string" ? body.recipientFirstName : "",
      recipientLastName: typeof body.recipientLastName === "string" ? body.recipientLastName : "",
      recipientEmail: typeof body.recipientEmail === "string" ? body.recipientEmail : "",
      recipientMessage: typeof body.recipientMessage === "string" ? body.recipientMessage : "",
      deliveryTarget: body.deliveryTarget === "buyer" ? "buyer" : "recipient",
    });
    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "RETREAT_NOT_FOUND" ||
        error.message === "RETREAT_DATE_NOT_FOUND" ||
        error.message === "RETREAT_DATE_UNAVAILABLE" ||
        error.message === "ROOM_OPTION_NOT_FOUND" ||
        error.message === "ROOM_OPTION_UNAVAILABLE" ||
        error.message === "SECOND_GUEST_REQUIRED" ||
        error.message === "RECIPIENT_REQUIRED")
    ) {
      return NextResponse.json({ message: "That retreat date is not available." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "RETREAT_LEGAL_ACCEPTANCE_REQUIRED") {
      return NextResponse.json(
        {
          code: "GUEST_LEGAL_ACCEPTANCE_REFRESH_REQUIRED",
          message:
            "The retreat legal agreements have changed. Refresh and review the latest versions before continuing.",
          requiredVersions: {
            terms: true,
            healthWaiver: true,
            healthData: true,
          },
        },
        { status: 409 }
      );
    }
    if (isAcceptanceRequiredError(error)) {
      return NextResponse.json(error.details, { status: 409 });
    }
    if (error instanceof Error && error.message === "DISPUTE_HOLD") {
      return NextResponse.json(
        {
          message: "Checkout is temporarily blocked while an open payment dispute is under review.",
        },
        { status: 409 }
      );
    }
    console.error("POST /api/retreats/[slug]/checkout failed", error);
    return NextResponse.json({ message: "Failed to start retreat checkout." }, { status: 500 });
  }
}
