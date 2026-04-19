import "server-only";

import { forbidden, tooManyRequests } from "@/lib/api/route";
import { getBaseSiteUrlFromEnv, env } from "@/lib/env";
import SecurityAlertEmail from "@/emails/security-alert";
import { getNotificationInbox, sendPostmarkReactEmail } from "@/lib/postmark/client";
import { recordUserLifecycleEvent } from "@/lib/user-lifecycle";

const AUTH_RATE_WINDOW_MS = 5 * 60 * 1000;
const AUTH_MAX_REQUESTS_PER_IP = 10;
const AUTH_MAX_REQUESTS_PER_EMAIL = 5;
const FAILED_LOGIN_ALERT_WINDOW_MS = 15 * 60 * 1000;
const FAILED_LOGIN_ALERT_THRESHOLD = 5;

const authEndpointRateLimitStore = new Map<string, number[]>();
const failedLoginAttemptStore = new Map<string, number[]>();

function normalizeOrigin(origin: string) {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function getAllowedAuthOrigins(request: Request) {
  const origins = new Set<string>();
  const configuredOrigin = normalizeOrigin(getBaseSiteUrlFromEnv());
  if (configuredOrigin) {
    origins.add(configuredOrigin);
  }

  const requestOrigin = normalizeOrigin(request.url);
  if (requestOrigin) {
    origins.add(requestOrigin);
  }

  if (env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://localhost:3001");
    origins.add("http://127.0.0.1:3001");
  }

  return origins;
}

function consumeRateLimit(key: string, maxAttempts: number, windowMs: number) {
  const now = Date.now();
  const recent = (authEndpointRateLimitStore.get(key) || []).filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (recent.length >= maxAttempts) {
    authEndpointRateLimitStore.set(key, recent);
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000));
    return { ok: false as const, retryAfterSeconds };
  }

  recent.push(now);
  authEndpointRateLimitStore.set(key, recent);
  return { ok: true as const };
}

export function enforceTrustedAuthOrigin(request: Request) {
  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    return;
  }

  const origin = normalizeOrigin(originHeader);
  if (!origin) {
    throw forbidden("Invalid Origin header.");
  }

  if (!getAllowedAuthOrigins(request).has(origin)) {
    throw forbidden("Cross-origin authentication requests are not allowed.");
  }
}

export function enforceAuthEndpointRateLimit(input: {
  route: "send_code" | "register";
  email?: string | null;
  requestIp?: string | null;
}) {
  const ipKey = `${input.route}:ip:${(input.requestIp || "unknown").trim() || "unknown"}`;
  const ipResult = consumeRateLimit(ipKey, AUTH_MAX_REQUESTS_PER_IP, AUTH_RATE_WINDOW_MS);
  if (!ipResult.ok) {
    throw tooManyRequests("Too many authentication attempts. Please try again shortly.", {
      retryAfterSeconds: ipResult.retryAfterSeconds,
    });
  }

  const email = input.email?.trim().toLowerCase();
  if (!email) {
    return;
  }

  const emailKey = `${input.route}:email:${email}`;
  const emailResult = consumeRateLimit(emailKey, AUTH_MAX_REQUESTS_PER_EMAIL, AUTH_RATE_WINDOW_MS);
  if (!emailResult.ok) {
    throw tooManyRequests("Too many authentication attempts for this email. Please wait.", {
      retryAfterSeconds: emailResult.retryAfterSeconds,
    });
  }
}

function recordFailedAttemptBucket(email: string | null, ip: string | null) {
  return `${email || "unknown-email"}|${ip || "unknown-ip"}`;
}

async function maybeAlertOnFailedLogin(input: {
  email: string | null;
  ip: string | null;
  reason: string;
}) {
  const bucket = recordFailedAttemptBucket(input.email, input.ip);
  const now = Date.now();
  const recent = (failedLoginAttemptStore.get(bucket) || []).filter(
    (timestamp) => now - timestamp < FAILED_LOGIN_ALERT_WINDOW_MS
  );
  recent.push(now);
  failedLoginAttemptStore.set(bucket, recent);

  if (recent.length !== FAILED_LOGIN_ALERT_THRESHOLD) {
    return;
  }

  try {
    await sendPostmarkReactEmail({
      to: getNotificationInbox("AUTH_ALERT_EMAIL"),
      subject: "Authentication security alert",
      react: SecurityAlertEmail({
        title: "Authentication security alert",
        summary: "Repeated failed login attempts were detected for the same email/IP combination.",
        email: input.email,
        ip: input.ip,
        reason: input.reason,
        occurredAt: new Date(now).toISOString(),
      }),
      textBody: [
        "Repeated failed login attempts were detected.",
        input.email ? `Email: ${input.email}` : null,
        input.ip ? `IP: ${input.ip}` : null,
        `Reason: ${input.reason}`,
        `Occurred at: ${new Date(now).toISOString()}`,
      ]
        .filter(Boolean)
        .join("\n"),
      tag: "auth-security-alert",
      metadata: {
        reason: input.reason,
        email: input.email || "unknown",
        ip: input.ip || "unknown",
      },
    });
  } catch (error) {
    console.error("[auth][security] failed to send security alert", error);
  }
}

export async function recordFailedLoginAttempt(input: {
  email?: string | null;
  ip?: string | null;
  reason: string;
}) {
  const email = input.email?.trim().toLowerCase() || null;
  const ip = input.ip?.trim() || null;

  console.warn("[auth][security] failed login attempt", {
    email,
    ip,
    reason: input.reason,
  });

  void recordUserLifecycleEvent({
    eventType: "auth_login_failed",
    payload: {
      email,
      ip,
      reason: input.reason,
      occurredAt: new Date().toISOString(),
    },
  }).catch((error) => {
    console.error("[auth][security] failed to persist failed login event", error);
  });

  void maybeAlertOnFailedLogin({
    email,
    ip,
    reason: input.reason,
  });
}
