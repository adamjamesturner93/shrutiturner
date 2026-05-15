import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitContactForm } from "@/lib/contact/service";
import { getClientIp, verifyTurnstileToken } from "@/lib/turnstile";
import { isRateLimited } from "@/lib/rate-limit";

type ContactBody = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  interest?: unknown;
  conditions?: unknown;
  howFound?: unknown;
  message?: unknown;
  contactConsent?: unknown;
  contactConsentText?: unknown;
  turnstileToken?: unknown;
  honeypot?: unknown;
};

export async function POST(request: Request) {
  const ip = getClientIp(request) || "contact";
  if (isRateLimited({ scope: "contact", key: ip, windowMs: 15 * 60 * 1000, max: 6 })) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => null)) as ContactBody | null;
  if (!body) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.honeypot === "string" && body.honeypot.trim()) {
    return NextResponse.json({ ok: true });
  }

  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken.trim() : "";
  const turnstileValid = await verifyTurnstileToken(turnstileToken, ip);
  if (!turnstileValid) {
    return NextResponse.json(
      { message: "Verification failed. Please try again." },
      { status: 400 }
    );
  }

  const session = await auth();

  try {
    const submission = await submitContactForm({
      userId: session?.user?.id || null,
      firstName: typeof body.firstName === "string" ? body.firstName : "",
      lastName: typeof body.lastName === "string" ? body.lastName : "",
      email: typeof body.email === "string" ? body.email : "",
      topic: typeof body.interest === "string" ? body.interest : "",
      conditions: typeof body.conditions === "string" ? body.conditions : "",
      howFound: typeof body.howFound === "string" ? body.howFound : "",
      message: typeof body.message === "string" ? body.message : "",
      contactConsent: body.contactConsent === true,
      contactConsentText:
        typeof body.contactConsentText === "string" ? body.contactConsentText : undefined,
    });

    return NextResponse.json({ ok: true, id: submission.id });
  } catch (error) {
    if (error instanceof Error) {
      const code =
        error.message === "NAME_REQUIRED" ||
        error.message === "EMAIL_REQUIRED" ||
        error.message === "TOPIC_REQUIRED" ||
        error.message === "MESSAGE_TOO_SHORT" ||
        error.message === "CONSENT_REQUIRED";
      if (code) {
        return NextResponse.json(
          { message: "Please complete all required fields." },
          { status: 400 }
        );
      }
    }
    console.error("POST /api/contact failed", error);
    return NextResponse.json({ message: "Failed to submit contact enquiry." }, { status: 500 });
  }
}
