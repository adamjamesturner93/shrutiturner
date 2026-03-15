import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  generateAuthCode,
  normalizeEmail,
  saveAuthCodeForEmail,
  sendAuthCodeEmail,
} from "@/lib/auth-code";
import { getClientIp, verifyTurnstileToken } from "@/lib/turnstile";
import { CURRENT_HEALTH_WAIVER_VERSION, CURRENT_TERMS_VERSION } from "@/data/legal-documents";

type RegisterBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;
  timezone?: string;
  dateFormat?: string;
  refCode?: string;
  turnstileToken?: string;
  agreeToTerms?: boolean;
  agreeToHealth?: boolean;
};

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as RegisterBody | null;

  const firstName = (body?.firstName || "").trim();
  const lastName = (body?.lastName || "").trim();
  const email = normalizeEmail(body?.email || "");
  const dobRaw = (body?.dob || "").trim();
  const timezone = (body?.timezone || "Europe/London").trim();
  const dateFormat = (body?.dateFormat || "DD/MM/YYYY").trim();
  const turnstileToken = (body?.turnstileToken || "").trim();
  const agreeToTerms = body?.agreeToTerms === true;
  const agreeToHealth = body?.agreeToHealth === true;
  const ip = getClientIp(req);

  if (!firstName || !lastName) {
    return NextResponse.json({ message: "First and last name are required." }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ message: "Valid email is required." }, { status: 400 });
  }

  const dob = new Date(dobRaw);
  if (!dobRaw || Number.isNaN(dob.getTime())) {
    return NextResponse.json({ message: "Valid date of birth is required." }, { status: 400 });
  }

  if (calculateAge(dob) < 18) {
    return NextResponse.json(
      { message: "You must be 18 or over to create an account." },
      { status: 400 }
    );
  }

  if (!agreeToTerms || !agreeToHealth) {
    return NextResponse.json(
      {
        message:
          "You must accept the Terms & Conditions and Health & Liability Waiver to create an account.",
      },
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

  const now = new Date();
  const code = generateAuthCode();
  const expiry = new Date(now.getTime() + 10 * 60 * 1000);

  const existingUser = await db.user.findUnique({ where: { email }, select: { id: true } });

  if (existingUser) {
    await db.user.update({
      where: { id: existingUser.id },
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        dob,
        timezone,
        dateFormat,
        hasAgreedToTerms: true,
        hasAgreedToHealth: true,
        acceptedTermsVersion: CURRENT_TERMS_VERSION,
        acceptedHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
        termsAgreedAt: new Date(),
        healthAgreedAt: new Date(),
      },
    });

    await saveAuthCodeForEmail(email, code, expiry);
  } else {
    await db.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email,
        dob,
        timezone,
        dateFormat,
        role: "student",
        authCode: code,
        authCodeExpiry: expiry,
        hasAgreedToTerms: true,
        hasAgreedToHealth: true,
        acceptedTermsVersion: CURRENT_TERMS_VERSION,
        acceptedHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
        termsAgreedAt: now,
        healthAgreedAt: now,
      },
    });
  }

  try {
    await sendAuthCodeEmail(email, code, 10);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send verification email.";
    return NextResponse.json({ message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, refCodeApplied: Boolean(body?.refCode) });
}
