import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSmallGroupCheckout } from "@/lib/small-groups/service";

type ProgrammeCheckoutBody = {
  runSlug?: unknown;
  purchaseMode?: unknown;
  purchaserFirstName?: unknown;
  purchaserLastName?: unknown;
  purchaserEmail?: unknown;
  attendeeFirstName?: unknown;
  attendeeLastName?: unknown;
  attendeeEmail?: unknown;
  recipientFirstName?: unknown;
  recipientLastName?: unknown;
  recipientEmail?: unknown;
  recipientMessage?: unknown;
  deliveryTarget?: unknown;
};

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = (await request.json().catch(() => null)) as ProgrammeCheckoutBody | null;
  if (!body) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const session = await auth();

  try {
    const result = await createSmallGroupCheckout({
      templateSlug: slug,
      runSlug: typeof body.runSlug === "string" ? body.runSlug : slug,
      purchaseMode: body.purchaseMode === "gift" ? "gift" : "self",
      userId: session?.user?.id || null,
      purchaserFirstName:
        typeof body.purchaserFirstName === "string" ? body.purchaserFirstName : "",
      purchaserLastName: typeof body.purchaserLastName === "string" ? body.purchaserLastName : "",
      purchaserEmail: typeof body.purchaserEmail === "string" ? body.purchaserEmail : "",
      attendeeFirstName: typeof body.attendeeFirstName === "string" ? body.attendeeFirstName : "",
      attendeeLastName: typeof body.attendeeLastName === "string" ? body.attendeeLastName : "",
      attendeeEmail: typeof body.attendeeEmail === "string" ? body.attendeeEmail : "",
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
      [
        "PROGRAMME_NOT_FOUND",
        "PROGRAMME_UNAVAILABLE",
        "RECIPIENT_REQUIRED",
        "ATTENDEE_REQUIRED",
      ].includes(error.message)
    ) {
      return NextResponse.json({ message: "That programme is not available." }, { status: 400 });
    }
    console.error("POST /api/programmes/[slug]/checkout failed", error);
    return NextResponse.json({ message: "Failed to start programme checkout." }, { status: 500 });
  }
}
