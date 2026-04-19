import { AuthChallengePurpose } from "@prisma/client";
import { sendAuthCodeEmail } from "@/lib/auth-code";
import { issueAuthChallenge, normalizeEmail } from "@/lib/auth-challenge";
import {
  apiOk,
  badRequest,
  handleApiRoute,
  parseJsonBody,
  tooManyRequests,
  upstreamFailure,
} from "@/lib/api/route";
import { db } from "@/lib/db";
import { claimReferralCode } from "@/lib/referrals/referral-service";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { recordUserLifecycleEvent } from "@/lib/user-lifecycle";

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

export const POST = handleApiRoute(async ({ request, requestIp }) => {
  const body = await parseJsonBody<RegisterBody>(request);

  const firstName = (body.firstName || "").trim();
  const lastName = (body.lastName || "").trim();
  const email = normalizeEmail(body.email || "");
  const dobRaw = (body.dob || "").trim();
  const timezone = (body.timezone || "Europe/London").trim();
  const dateFormat = (body.dateFormat || "DD/MM/YYYY").trim();
  const turnstileToken = (body.turnstileToken || "").trim();
  const agreeToTerms = body.agreeToTerms === true;
  const agreeToHealth = body.agreeToHealth === true;

  if (!firstName || !lastName) {
    throw badRequest("First and last name are required.");
  }

  if (!email || !email.includes("@")) {
    throw badRequest("Valid email is required.");
  }

  const dob = new Date(dobRaw);
  if (!dobRaw || Number.isNaN(dob.getTime())) {
    throw badRequest("Valid date of birth is required.");
  }

  if (calculateAge(dob) < 18) {
    throw badRequest("You must be 18 or over to create an account.");
  }

  if (!agreeToTerms || !agreeToHealth) {
    throw badRequest("You must accept Terms and Health Declaration to create an account.");
  }

  const turnstileValid = await verifyTurnstileToken(turnstileToken, requestIp);
  if (!turnstileValid) {
    throw badRequest("Verification failed. Please try again.");
  }

  const now = new Date();
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser?.deletedAt) {
    throw badRequest("This account has been deleted and cannot be reused.");
  }

  const user = existingUser
    ? await db.user.update({
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
          termsAgreedAt: existingUser.termsAgreedAt || now,
          healthAgreedAt: existingUser.healthAgreedAt || now,
          deletedAt: null,
        },
      })
    : await db.user.create({
        data: {
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          email,
          dob,
          timezone,
          dateFormat,
          role: "student",
          hasAgreedToTerms: true,
          hasAgreedToHealth: true,
          termsAgreedAt: now,
          healthAgreedAt: now,
        },
      });

  if (!existingUser) {
    await recordUserLifecycleEvent({
      eventType: "user_created",
      userId: user.id,
      actorUserId: user.id,
      payload: {
        source: "self_serve_signup",
      },
    });
  }

  if (body.refCode?.trim()) {
    await claimReferralCode(user.id, body.refCode.trim()).catch(() => null);
  }

  const issued = await issueAuthChallenge({
    email,
    userId: user.id,
    purpose: AuthChallengePurpose.signup,
    ip: requestIp,
    metadata: {
      source: "register",
      timezone,
      dateFormat,
    },
  });

  if (!issued.ok) {
    throw tooManyRequests("Please wait before requesting another code.", {
      retryAfterSeconds: issued.retryAfterSeconds,
    });
  }

  try {
    await sendAuthCodeEmail(email, issued.code, issued.expiryMinutes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send verification email.";
    throw upstreamFailure(message);
  }

  return apiOk({
    created: !existingUser,
    expiresAt: issued.expiresAt.toISOString(),
    refCodeApplied: Boolean(body.refCode?.trim()),
  });
});
