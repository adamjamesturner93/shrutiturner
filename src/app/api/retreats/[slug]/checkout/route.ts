import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { isAcceptanceRequiredError } from "@/lib/legal/acceptance-service";
import { createRetreatCheckout } from "@/lib/retreats/service";

type RetreatCheckoutBody = {
  retreatDateId?: unknown;
  roomOptionId?: unknown;
  guestCount?: unknown;
  purchaseMode?: unknown;
  paymentOption?: unknown;
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
  addons?: unknown;
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
      guestCount: typeof body.guestCount === "number" ? body.guestCount : undefined,
      purchaseMode: body.purchaseMode === "gift" ? "gift" : "self",
      paymentOption: body.paymentOption === "pay_in_full" ? "pay_in_full" : "deposit",
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
      addons: Array.isArray(body.addons)
        ? body.addons.flatMap((value) => {
            if (!value || typeof value !== "object" || Array.isArray(value)) return [];
            const row = value as Record<string, unknown>;
            return typeof row.addonId === "string" && typeof row.quantity === "number"
              ? [{ addonId: row.addonId, quantity: row.quantity }]
              : [];
          })
        : [],
    });
    revalidateTag("retreats-public", "max");
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        {
          code: "SESSION_INVALID",
          message: "Your account session is no longer valid. Please sign in again.",
        },
        { status: 401 }
      );
    }
    if (
      error instanceof Error &&
      (error.message === "RETREAT_NOT_FOUND" ||
        error.message === "RETREAT_DATE_NOT_FOUND" ||
        error.message === "ROOM_OPTION_NOT_FOUND" ||
        error.message === "RETREAT_GUEST_COUNT_INVALID" ||
        error.message === "RETREAT_RATE_PLAN_NOT_FOUND" ||
        error.message === "ATTENDEE_REQUIRED" ||
        error.message === "SECOND_GUEST_REQUIRED" ||
        error.message === "RECIPIENT_REQUIRED" ||
        error.message === "RETREAT_ADDON_INVALID" ||
        error.message === "RETREAT_GIFT_ADDONS_UNSUPPORTED")
    ) {
      return NextResponse.json(
        { message: "Check the booking details and try again." },
        { status: 400 }
      );
    }
    if (
      error instanceof Error &&
      [
        "RETREAT_DATE_UNAVAILABLE",
        "RETREAT_BOOKING_WINDOW_CLOSED",
        "ROOM_OPTION_UNAVAILABLE",
        "RETREAT_ADDON_UNAVAILABLE",
        "RETREAT_CAPACITY_UNAVAILABLE",
      ].includes(error.message)
    ) {
      return NextResponse.json(
        {
          code: "RETREAT_AVAILABILITY_CHANGED",
          message:
            "Availability changed while you were booking. Refresh the page and choose from the remaining options.",
        },
        { status: 409 }
      );
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
