import { NextResponse } from "next/server";
import { ServerClient } from "postmark";
import { getNewsletterSignupContent } from "@/lib/content";
import { render } from "@react-email/render";
import WelcomeEmail from "@/emails/welcome";
import { getClientIp, verifyTurnstileToken } from "@/lib/turnstile";
import { db } from "@/lib/db";
import { subscribeMarketingEmail } from "@/lib/newsletter/subscriber-service";
import { getPostmarkMessageStream } from "@/lib/postmark/client";

type SignupRequestBody = {
  email?: unknown;
  firstName?: unknown;
  marketingOptIn?: unknown;
  consent?: unknown;
  honeypot?: unknown;
  source?: unknown;
  turnstileToken?: unknown;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 8;
const rateLimitStore = new Map<string, number[]>();

export function resetNewsletterSignupRateLimitStore() {
  rateLimitStore.clear();
}

function applyTokens(template: string, values: Record<string, string>): string {
  let output = template;
  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }
  return output;
}

function getBaseSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://shrutiturner.com";
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function normalizeFirstName(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 80);
}

function normalizeSource(value: unknown): "popup" | "inline" | "footer" | "homepage" | "subscribe" {
  if (
    value === "popup" ||
    value === "inline" ||
    value === "footer" ||
    value === "homepage" ||
    value === "subscribe"
  ) {
    return value;
  }
  return "inline";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = rateLimitStore.get(ip) || [];
  const recent = attempts.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

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

  // Honeypot for basic bot filtering.
  if (typeof body.honeypot === "string" && body.honeypot.trim().length > 0) {
    return NextResponse.json({ ok: true, message: "Thanks, please check your inbox." });
  }

  const email = normalizeEmail(body.email);
  const firstName = normalizeFirstName(body.firstName) || "there";
  const marketingOptIn = body.marketingOptIn === true;
  const consent = body.consent === true;
  const source = normalizeSource(body.source);
  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken.trim() : "";

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

  const postmarkToken = process.env.POSTMARK_API_TOKEN;
  const fromEmail =
    process.env.POSTMARK_FROM_EMAIL || "Shruti Turner <shruti@thechronicyogini.com>";
  if (!postmarkToken) {
    return NextResponse.json(
      { message: "Postmark is not configured. Set POSTMARK_API_TOKEN." },
      { status: 500 }
    );
  }

  const signupContent = await getNewsletterSignupContent();
  const subject = signupContent.emailSubject || "Welcome to Shruti Turner's newsletter";

  const fallbackBody =
    "Hi {{firstName}},\n\nThanks for joining. Your free guide is ready here:\n{{leadMagnetLink}}\n\nYou can unsubscribe anytime: {{unsubscribeUrl}}\n\nShruti";

  const siteUrl = getBaseSiteUrl().replace(/\/$/, "");
  const leadMagnetUrl = signupContent.assetUrl || `${siteUrl}/blog`;
  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  const subscriber = await subscribeMarketingEmail({
    email,
    userId: existingUser?.id || null,
    source,
    surface: `newsletter_signup_${source}`,
    wordingText:
      signupContent.consentText ||
      "I want to receive marketing emails, newsletter updates, and occasional offers from Shruti Turner. I can unsubscribe at any time.",
  });

  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${encodeURIComponent(subscriber.token)}`;
  const welcomeCopy = applyTokens(signupContent.emailBody || fallbackBody, {
    firstName,
    email,
    leadMagnetLink: leadMagnetUrl,
    unsubscribeUrl,
  });
  const compliantTextBody = `${welcomeCopy}\n\n---\nYou are receiving this because you opted in on ${siteUrl}.\nManage subscriptions: ${unsubscribeUrl}`;

  const htmlBody = await render(
    WelcomeEmail({
      firstName,
      leadMagnetTitle: signupContent.leadMagnetTitle || "Your free guide",
      leadMagnetDescription:
        signupContent.popupDescription ||
        "Thanks for joining. Your free guide is ready using the link below.",
      downloadUrl: leadMagnetUrl,
      ctaLabel: signupContent.buttonLabel || "Download your guide",
      welcomeCopy,
      classesUrl: `${siteUrl}/classes`,
      blogUrl: `${siteUrl}/blog`,
      aboutUrl: `${siteUrl}/about`,
      unsubscribeUrl,
    })
  );

  const client = new ServerClient(postmarkToken);

  try {
    await client.sendEmail({
      From: fromEmail,
      To: email,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: compliantTextBody,
      MessageStream: getPostmarkMessageStream("marketing"),
      Tag: "newsletter-signup",
      Metadata: {
        emailCategory: "marketing",
        source,
        consent: "true",
        marketingOptIn: "true",
        subscribedAt: new Date().toISOString(),
        subscriberId: subscriber.id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed.";
    return NextResponse.json({ message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, message: signupContent.successMessage });
}
