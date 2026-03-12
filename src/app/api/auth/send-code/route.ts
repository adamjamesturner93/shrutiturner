import { NextResponse } from "next/server";
import {
  generateAuthCode,
  normalizeEmail,
  saveAuthCodeForEmail,
  sendAuthCodeEmail,
} from "@/lib/auth-code";
import { getClientIp, verifyTurnstileToken } from "@/lib/turnstile";

type SendCodeBody = {
  email?: string;
  turnstileToken?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as SendCodeBody | null;
  const email = normalizeEmail(body?.email || "");
  const turnstileToken = (body?.turnstileToken || "").trim();
  const ip = getClientIp(req);

  if (!email || !email.includes("@")) {
    return NextResponse.json({ message: "Invalid email." }, { status: 400 });
  }

  const turnstileValid = await verifyTurnstileToken(turnstileToken, ip);
  if (!turnstileValid) {
    return NextResponse.json(
      { message: "Verification failed. Please try again." },
      { status: 400 }
    );
  }

  const code = generateAuthCode();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  await saveAuthCodeForEmail(email, code, expiry);

  try {
    await sendAuthCodeEmail(email, code, 10);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email.";
    return NextResponse.json({ message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
