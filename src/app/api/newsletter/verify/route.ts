import { makeReceipt, RECEIPT_COOKIE } from "@/lib/analytics/receipt";
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

    let guideDelivered = false;
    try {
      const delivery = await sendLeadMagnetDeliveryEmail({
        email: subscriber.email,
        firstName: subscriber.firstName,
        subscriberId: subscriber.id,
      });

      guideDelivered = Boolean(delivery && !delivery.skipped && delivery.status === "sent");
      await recordNewsletterSignupEvent({
        email: subscriber.email,
        source: subscriber.source || "unknown",
        eventType: "lead_magnet_sent",
      });
    } catch (emailError) {
      console.error("Failed to send lead magnet email", emailError);
    }

    const response = redirectToStatus(request, "success");
    // An optional, signed receipt bridges the verified action to a consenting browser.
    // No subscriber identity or verification token enters the receipt or GA.
    try {
      if (/(?:^|;\s*)st_analytics=granted(?:;|$)/.test(request.headers.get("cookie") || "")) {
        response.cookies.set(RECEIPT_COOKIE, makeReceipt(subscriber.source, guideDelivered), {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 600,
        });
      }
    } catch {
      /* Signup and guide delivery must not depend on analytics. */
    }
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_TOKEN") {
      return redirectToStatus(request, "invalid");
    }

    console.error("GET /api/newsletter/verify failed", error);
    return redirectToStatus(request, "invalid");
  }
}
