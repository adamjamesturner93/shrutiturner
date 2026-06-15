import { createHash, randomInt } from "node:crypto";
import { AuthChallengePurpose, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function generateAuthCode() {
  return String(randomInt(100000, 999999));
}

function hashAuthCode(code: string) {
  return createHash("sha256")
    .update(`${env.AUTH_SECRET || "development-auth-secret"}:${code}`)
    .digest("hex");
}

export async function issueAuthChallenge(input: {
  email: string;
  purpose: AuthChallengePurpose;
  userId?: string | null;
  redirectTo?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const email = normalizeEmail(input.email);
  const cooldownMs = env.AUTH_OTP_RESEND_COOLDOWN_SECONDS * 1000;
  const now = new Date();
  const latestPending = await db.authChallenge.findFirst({
    where: {
      email,
      purpose: input.purpose,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { sentAt: "desc" },
  });

  if (latestPending && now.getTime() - latestPending.sentAt.getTime() < cooldownMs) {
    return {
      ok: false as const,
      reason: "cooldown",
      retryAfterSeconds: Math.ceil(
        (cooldownMs - (now.getTime() - latestPending.sentAt.getTime())) / 1000
      ),
    };
  }

  await db.authChallenge.updateMany({
    where: {
      email,
      purpose: input.purpose,
      consumedAt: null,
    },
    data: {
      consumedAt: now,
    },
  });

  const code = generateAuthCode();
  const expiresAt = new Date(now.getTime() + env.AUTH_OTP_EXPIRY_MINUTES * 60 * 1000);
  const challenge = await db.authChallenge.create({
    data: {
      email,
      userId: input.userId || null,
      purpose: input.purpose,
      codeHash: hashAuthCode(code),
      expiresAt,
      maxAttempts: env.AUTH_OTP_MAX_ATTEMPTS,
      redirectTo: input.redirectTo || null,
      sentIp: input.ip || null,
      metadataJson: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  return {
    ok: true as const,
    challenge,
    code,
    expiresAt,
    expiryMinutes: env.AUTH_OTP_EXPIRY_MINUTES,
  };
}

export async function verifyAuthChallenge(input: {
  email: string;
  code: string;
  purposes?: AuthChallengePurpose[];
  ip?: string | null;
}) {
  const email = normalizeEmail(input.email);
  const purposes = input.purposes?.length
    ? input.purposes
    : [AuthChallengePurpose.login, AuthChallengePurpose.signup, AuthChallengePurpose.email_change];
  const now = new Date();

  const challenge = await db.authChallenge.findFirst({
    where: {
      email,
      purpose: { in: purposes },
      consumedAt: null,
    },
    orderBy: { sentAt: "desc" },
  });

  if (!challenge) {
    return { ok: false as const, reason: "not_found" };
  }

  if (challenge.expiresAt <= now) {
    return { ok: false as const, reason: "expired" };
  }

  if (challenge.attemptCount >= challenge.maxAttempts) {
    return { ok: false as const, reason: "max_attempts" };
  }

  if (challenge.codeHash !== hashAuthCode(input.code)) {
    await db.authChallenge.update({
      where: { id: challenge.id },
      data: {
        attemptCount: { increment: 1 },
        lastAttemptAt: now,
        lastAttemptIp: input.ip || null,
      },
    });
    return { ok: false as const, reason: "invalid" };
  }

  const verified = await db.authChallenge.update({
    where: { id: challenge.id },
    data: {
      consumedAt: now,
      lastAttemptAt: now,
      lastAttemptIp: input.ip || null,
    },
  });

  return { ok: true as const, challenge: verified };
}
