import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitCoachingEnquiry } from "@/lib/coaching/service";
import { isRateLimited } from "@/lib/rate-limit";
import { getClientIp, verifyTurnstileToken } from "@/lib/turnstile";

type EnquiryBody = {
  name?: unknown;
  email?: unknown;
  support?: unknown;
  movement?: unknown;
  context?: unknown;
  outcome?: unknown;
  extra?: unknown;
  referral?: unknown;
  consent?: unknown;
  consentText?: unknown;
  turnstileToken?: unknown;
  honeypot?: unknown;
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const ip = getClientIp(request) || "coaching-enquiry";
  if (isRateLimited({ scope: "coaching-enquiry", key: ip, windowMs: 15 * 60 * 1000, max: 5 })) {
    return NextResponse.json(
      { message: "Too many enquiries. Please try again later." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => null)) as EnquiryBody | null;
  if (!body) return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  if (stringValue(body.honeypot).trim()) return NextResponse.json({ ok: true });
  if (body.consent !== true) {
    return NextResponse.json({ message: "Consent is required." }, { status: 400 });
  }

  const validTurnstile = await verifyTurnstileToken(stringValue(body.turnstileToken), ip);
  if (!validTurnstile) {
    return NextResponse.json(
      { message: "Verification failed. Please try again." },
      { status: 400 }
    );
  }

  try {
    const session = await auth();
    const application = await submitCoachingEnquiry({
      userId: session?.user?.id || null,
      applicantName: stringValue(body.name),
      applicantEmail: stringValue(body.email),
      consentText: stringValue(body.consentText),
      answers: {
        support: stringValue(body.support),
        movement: stringValue(body.movement),
        context: stringValue(body.context),
        outcome: stringValue(body.outcome),
        extra: stringValue(body.extra),
        referral: stringValue(body.referral),
      },
    });
    return NextResponse.json({ ok: true, id: application.id });
  } catch (error) {
    if (
      error instanceof Error &&
      ["NAME_REQUIRED", "EMAIL_REQUIRED", "ANSWERS_REQUIRED", "CONSENT_REQUIRED"].includes(
        error.message
      )
    ) {
      return NextResponse.json(
        { message: "Please complete all required fields." },
        { status: 400 }
      );
    }
    console.error("POST /api/coaching/enquiries failed", error);
    return NextResponse.json({ message: "Failed to send your enquiry." }, { status: 500 });
  }
}
