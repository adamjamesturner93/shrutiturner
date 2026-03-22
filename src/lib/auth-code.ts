import { randomInt } from "crypto";
import { render } from "@react-email/render";
import { ServerClient } from "postmark";
import AuthCodeEmail from "@/emails/auth-code";
import { db } from "@/lib/db";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function generateAuthCode() {
  return String(randomInt(100000, 999999));
}

export async function saveAuthCodeForEmail(email: string, code: string, expiresAt: Date) {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return db.user.update({
      where: { email },
      data: { authCode: code, authCodeExpiry: expiresAt },
    });
  }

  return db.user.create({
    data: {
      email,
      role: "student",
      authCode: code,
      authCodeExpiry: expiresAt,
    },
  });
}

export async function sendAuthCodeEmail(email: string, code: string, expiryMinutes = 10) {
  if (process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1") {
    return;
  }

  const postmarkToken = process.env.POSTMARK_API_TOKEN;
  if (!postmarkToken) {
    throw new Error("POSTMARK_API_TOKEN is not configured.");
  }

  const from = process.env.POSTMARK_FROM_EMAIL || "Shruti Turner <noreply@thechronicyogini.com>";
  const client = new ServerClient(postmarkToken);

  const html = await render(AuthCodeEmail({ code, expiryMinutes }));
  const text = `Your login code is ${code}. It expires in ${expiryMinutes} minutes.`;

  await client.sendEmail({
    From: from,
    To: email,
    Subject: "Your login code",
    HtmlBody: html,
    TextBody: text,
    MessageStream: "outbound",
    Tag: "auth-code",
  });
}
