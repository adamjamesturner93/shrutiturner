import { NextResponse } from "next/server";
import { getNewsletterSignupContent } from "@/lib/content";
import { db } from "@/lib/db";
import { recordNewsletterSignupEvent } from "@/lib/newsletter/event-service";
import { sendNewsletterVerificationEmail } from "@/lib/newsletter/email-service";
import { createPendingMarketingSubscriber } from "@/lib/newsletter/subscriber-service";
import { getClientIp, verifyTurnstileToken } from "@/lib/turnstile";

type SignupRequestBody = {
  consent?: unknown;
  email?: unknown;
  firstName?: unknown;
  honeypot?: unknown;
  marketingOptIn?: unknown;
  source?: unknown;
  turnstileToken?: unknown;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map<string, number[]>();

export function resetNewsletterSignupRateLimitStore() {
  rateLimitStore.clear();
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function normalizeFirstName(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 80);
}

function normalizeSource(
  value: unknown
): "popup" | "inline" | "footer" | "homepage" | "subscribe" | "holding-page" {
  if (
    value === "popup" ||
    value === "inline" ||
    value === "footer" ||
    value === "homepage" ||
    value === "subscribe" ||
    value === "holding-page"
  ) {
    return value;
  }
  return "inline";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = rateLimitStore.get(ip) || [];
  const recent = attempts.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);
  return false;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { message: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => null)) as SignupRequestBody | null;
  if (!body) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.honeypot === "string" && body.honeypot.trim().length > 0) {
    return NextResponse.json({
      ok: true,
      message: "Please check your inbox to confirm your email address.",
    });
  }

  const email = normalizeEmail(body.email);
  const firstName = normalizeFirstName(body.firstName);
  const marketingOptIn = body.marketingOptIn === true;
  const consent = body.consent === true;
  const source = normalizeSource(body.source);
  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken.trim() : "";

  if (!firstName) {
    return NextResponse.json({ message: "Please enter your first name." }, { status: 400 });
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  if (!consent) {
    return NextResponse.json(
      { message: "You must provide consent before subscribing." },
      { status: 400 }
    );
  }

  if (!marketingOptIn) {
    return NextResponse.json(
      { message: "Please confirm you'd like to receive marketing emails." },
      { status: 400 }
    );
  }

  const turnstileValid = await verifyTurnstileToken(turnstileToken, ip);
  if (!turnstileValid) {
    return NextResponse.json(
      { message: "Verification failed. Please try again." },
      { status: 400 }
    );
  }

  const signupContent = await getNewsletterSignupContent();

  await recordNewsletterSignupEvent({
    email,
    source,
    eventType: "subscribe_attempt",
  });

  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  try {
    const result = await createPendingMarketingSubscriber({
      email,
      firstName,
      userId: existingUser?.id || null,
      source,
      surface: `newsletter_signup_${source}`,
      wordingText:
        signupContent.consentText ||
        "I want to receive marketing emails, newsletter updates, and occasional offers from Shruti Turner. I can unsubscribe at any time.",
    });

    if (result.state === "subscribed") {
      await recordNewsletterSignupEvent({
        email,
        source,
        eventType: "already_subscribed",
      });

      return NextResponse.json({
        ok: true,
        message: "You’re already confirmed. Keep an eye on your inbox for the next update.",
      });
    }

    await sendNewsletterVerificationEmail({
      email,
      firstName,
      source,
      subscriberId: result.subscriber.id,
      verificationToken: result.verificationToken,
    });

    await recordNewsletterSignupEvent({
      email,
      source,
      eventType: "subscribe_pending",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "POSTMARK_NOT_CONFIGURED") {
      return NextResponse.json(
        { message: "Email delivery is not configured right now. Please try again later." },
        { status: 500 }
      );
    }

    const message = error instanceof Error ? error.message : "Unable to subscribe right now.";
    return NextResponse.json({ message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message:
      signupContent.successMessage || "Please check your inbox to confirm your email address.",
  });
}
