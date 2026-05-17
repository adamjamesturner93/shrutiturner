import { AuthChallengePurpose } from "@prisma/client";
import { sendAuthCodeEmail } from "@/lib/auth-code";
import { issueAuthChallenge, normalizeEmail } from "@/lib/auth-challenge";
import { enforceAuthEndpointRateLimit, enforceTrustedAuthOrigin } from "@/lib/auth-security";
import {
  apiOk,
  badRequest,
  handleApiRoute,
  parseJsonBody,
  tooManyRequests,
  upstreamFailure,
} from "@/lib/api/route";
import { db } from "@/lib/db";
import { verifyTurnstileToken } from "@/lib/turnstile";

type SendCodeBody = {
  email?: string;
  turnstileToken?: string;
  redirectTo?: string;
};

export const POST = handleApiRoute(async ({ request, requestIp }) => {
  const body = await parseJsonBody<SendCodeBody>(request);
  const email = normalizeEmail(body.email || "");
  const turnstileToken = (body.turnstileToken || "").trim();

  enforceTrustedAuthOrigin(request);

  if (!email || !email.includes("@")) {
    throw badRequest("Invalid email.");
  }

  enforceAuthEndpointRateLimit({
    route: "send_code",
    email,
    requestIp,
  });

  const turnstileValid = await verifyTurnstileToken(turnstileToken, requestIp);
  if (!turnstileValid) {
    throw badRequest("Verification failed. Please try again.");
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, deletedAt: true },
  });
  if (user?.deletedAt) {
    throw badRequest("This account has been deleted and cannot be reused.");
  }

  const issued = await issueAuthChallenge({
    email,
    userId: user?.id || null,
    purpose: user ? AuthChallengePurpose.login : AuthChallengePurpose.signup,
    redirectTo: body.redirectTo || null,
    ip: requestIp,
    ...(user
      ? {}
      : {
          metadata: {
            source: "passwordless_signup",
          },
        }),
  });

  if (!issued.ok) {
    throw tooManyRequests("Please wait before requesting another code.", {
      retryAfterSeconds: issued.retryAfterSeconds,
    });
  }

  try {
    await sendAuthCodeEmail(email, issued.code, issued.expiryMinutes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email.";
    throw upstreamFailure(message);
  }

  return apiOk({
    sent: true,
    expiresAt: issued.expiresAt.toISOString(),
    retryAfterSeconds: 0,
  });
});
