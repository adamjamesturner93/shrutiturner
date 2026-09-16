import { encode } from "next-auth/jwt";
import type { UserRole } from "@prisma/client";
import type { Page } from "@playwright/test";
import { db } from "./db";
import { sanitizeSegment, uniqueToken } from "./_shared";

const DEFAULT_AUTH_CODE = "123456";
const DEFAULT_PLAYWRIGHT_PORT = "3001";
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function getPlaywrightBaseUrl() {
  return new URL(
    process.env.PLAYWRIGHT_BASE_URL ||
      `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT || DEFAULT_PLAYWRIGHT_PORT}`
  );
}

function getSessionCookieName(baseUrl: URL) {
  return baseUrl.protocol === "https:" ? "__Secure-authjs.session-token" : "authjs.session-token";
}

function defaultPostLoginPath(expectedUrlPattern?: RegExp | string) {
  if (expectedUrlPattern && String(expectedUrlPattern).toLowerCase().includes("admin")) {
    return "/admin";
  }
  return "/dashboard";
}

export function makeE2eAuthEmail(label: string) {
  const segment = sanitizeSegment(label) || "member";
  return `e2e-auth+${segment}-${uniqueToken(segment)}@example.com`;
}

export async function preparePasswordlessCode(
  email: string,
  options?: {
    code?: string;
    role?: UserRole;
  }
) {
  const normalizedEmail = email.trim().toLowerCase();
  const authCode = options?.code || DEFAULT_AUTH_CODE;
  const role = options?.role || "member";

  return db.user.upsert({
    where: { email: normalizedEmail },
    create: {
      email: normalizedEmail,
      role,
      emailVerified: new Date(),
      authCode,
      authCodeExpiry: new Date(Date.now() + 15 * 60 * 1000),
    },
    update: {
      deletedAt: null,
      authCode,
      authCodeExpiry: new Date(Date.now() + 15 * 60 * 1000),
      emailVerified: new Date(),
    },
  });
}

export async function loginWithEmail(
  page: Page,
  email: string,
  authCode = DEFAULT_AUTH_CODE,
  expectedUrlPattern?: RegExp | string
) {
  const user = await preparePasswordlessCode(email, { code: authCode });
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  const baseUrl = getPlaywrightBaseUrl();
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for local authenticated fixtures");
  const sessionToken = await encode({
    secret,
    salt: getSessionCookieName(baseUrl),
    maxAge: SESSION_TTL_MS / 1000,
    token: { sub: user.id, id: user.id, email: user.email, role: user.role, name: user.name },
  });

  await page.context().addCookies([
    {
      name: getSessionCookieName(baseUrl),
      value: sessionToken,
      url: baseUrl.origin,
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(expires.getTime() / 1000),
    },
  ]);

  await page.goto(defaultPostLoginPath(expectedUrlPattern));

  if (expectedUrlPattern) {
    await page.waitForURL(expectedUrlPattern);
  } else {
    await page.waitForURL(/\/dashboard(?:\/|$|\?)/);
  }

  return user;
}
