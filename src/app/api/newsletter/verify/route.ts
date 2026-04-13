import { NextResponse } from "next/server";
import { recordNewsletterSignupEvent } from "@/lib/newsletter/event-service";
import { sendLeadMagnetDeliveryEmail } from "@/lib/newsletter/email-service";
import { verifyMarketingEmailByToken } from "@/lib/newsletter/subscriber-service";

function redirectToStatus(request: Request, status: "success" | "invalid") {
  return NextResponse.redirect(new URL(`/?verified=${status}`, request.url));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() || "";

  if (!token) {
    return redirectToStatus(request, "invalid");
  }

  try {
    const subscriber = await verifyMarketingEmailByToken(token);

    await recordNewsletterSignupEvent({
      email: subscriber.email,
      source: subscriber.source || "unknown",
      eventType: "verify_success",
    });

    try {
      await sendLeadMagnetDeliveryEmail({
        email: subscriber.email,
        firstName: subscriber.firstName,
        subscriberId: subscriber.id,
      });

      await recordNewsletterSignupEvent({
        email: subscriber.email,
        source: subscriber.source || "unknown",
        eventType: "lead_magnet_sent",
      });
    } catch (emailError) {
      console.error("Failed to send lead magnet email", emailError);
    }

    return redirectToStatus(request, "success");
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_TOKEN") {
      return redirectToStatus(request, "invalid");
    }

    console.error("GET /api/newsletter/verify failed", error);
    return redirectToStatus(request, "invalid");
  }
}
