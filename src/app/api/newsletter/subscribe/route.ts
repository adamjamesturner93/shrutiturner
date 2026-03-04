import { NextResponse } from "next/server";
import { ServerClient } from "postmark";
import { getNewsletterSignupContent } from "@/lib/content";

type SignupRequestBody = {
  email?: unknown;
  firstName?: unknown;
  lists?: unknown;
  consent?: unknown;
  honeypot?: unknown;
  source?: unknown;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 8;
const rateLimitStore = new Map<string, number[]>();

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyTokens(template: string, values: Record<string, string>): string {
  let output = template;
  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }
  return output;
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function normalizeFirstName(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 80);
}

function normalizeSource(value: unknown): "popup" | "inline" | "footer" | "homepage" {
  if (value === "popup" || value === "inline" || value === "footer" || value === "homepage") {
    return value;
  }
  return "inline";
}

function normalizeLists(value: unknown): Array<"newsletter" | "blog"> {
  if (!Array.isArray(value)) return [];
  const next = new Set<"newsletter" | "blog">();
  for (const entry of value) {
    if (entry === "newsletter" || entry === "blog") {
      next.add(entry);
    }
  }
  return Array.from(next);
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip") || "unknown";
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
  const consent = body.consent === true;
  const lists = normalizeLists(body.lists);
  const source = normalizeSource(body.source);

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  if (!consent) {
    return NextResponse.json(
      { message: "You must provide consent before subscribing." },
      { status: 400 }
    );
  }

  if (lists.length === 0) {
    return NextResponse.json(
      { message: "Please choose at least one email preference." },
      { status: 400 }
    );
  }

  const postmarkToken = process.env.POSTMARK_API_TOKEN;
  const fromEmail = process.env.POSTMARK_FROM_EMAIL || "Shruti Turner <shruti@thechronicyogini.com>";
  if (!postmarkToken) {
    return NextResponse.json(
      { message: "Postmark is not configured. Set POSTMARK_API_TOKEN." },
      { status: 500 }
    );
  }

  const signupContent = await getNewsletterSignupContent();
  const subject = signupContent.emailSubject || "Welcome to Shruti Turner's newsletter";
  const preview = signupContent.emailPreviewText || "Thanks for subscribing.";

  const fallbackBody =
    "Hi {{firstName}},\n\nThanks for joining. Your free guide is ready here:\n{{leadMagnetLink}}\n\nYou can unsubscribe anytime: {{unsubscribeUrl}}\n\nShruti";

  const leadMagnetUrl = signupContent.assetUrl || "https://shrutiturner.com/blog";
  const unsubscribeUrl = `https://shrutiturner.com/unsubscribe?email=${encodeURIComponent(email)}`;
  const textBody = applyTokens(signupContent.emailBody || fallbackBody, {
    firstName,
    email,
    leadMagnetLink: leadMagnetUrl,
    unsubscribeUrl,
  });
  const compliantTextBody = `${textBody}\n\n---\nYou are receiving this because you opted in on shrutiturner.com.\nManage subscriptions: ${unsubscribeUrl}`;

  const htmlBody = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">${escapeHtml(preview)}</p>
        <div>${escapeHtml(compliantTextBody).replaceAll("\n", "<br/>")}</div>
      </body>
    </html>
  `;

  const client = new ServerClient(postmarkToken);

  try {
    await client.sendEmail({
      From: fromEmail,
      To: email,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: compliantTextBody,
      MessageStream: "outbound",
      Tag: "newsletter-signup",
      Metadata: {
        source,
        consent: "true",
        lists: lists.join(","),
        subscribedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed.";
    return NextResponse.json({ message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, message: signupContent.successMessage });
}
