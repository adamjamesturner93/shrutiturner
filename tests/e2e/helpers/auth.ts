import { expect, type Page } from "@playwright/test";
import { db } from "@/lib/db";

const E2E_AUTH_PREFIX = "e2e-app-";

export function makeE2eAuthEmail(label: string) {
  return `${E2E_AUTH_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function cleanupE2eAuthUsers() {
  await db.user.deleteMany({
    where: {
      email: {
        startsWith: E2E_AUTH_PREFIX,
      },
    },
  });
}

export async function preparePasswordlessCode(email: string, code = "123456") {
  const normalizedEmail = email.trim().toLowerCase();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  await db.user.upsert({
    where: { email: normalizedEmail },
    update: {
      authCode: code,
      authCodeExpiry: expiry,
    },
    create: {
      email: normalizedEmail,
      authCode: code,
      authCodeExpiry: expiry,
    },
  });

  return code;
}

export async function loginWithEmail(
  page: Page,
  email: string,
  code = "123456",
  expectedUrl: RegExp = /\/dashboard(?:\?|$)/
) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with Email" }).click();
  await page.getByLabel("Email Address").fill(email);
  await expect(page.getByTestId("turnstile-bypass").first()).toBeVisible();
  await page.getByRole("button", { name: "Send Verification Code" }).click();
  await expect(page.getByLabel("Verification Code")).toBeVisible({ timeout: 15_000 });
  const normalizedEmail = email.toLowerCase();
  let issuedCode = code;
  await expect
    .poll(
      async () => {
        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
          select: { authCode: true },
        });
        if (user?.authCode) {
          issuedCode = user.authCode;
        }
        return Boolean(user?.authCode);
      },
      { timeout: 10_000 }
    )
    .toBe(true);
  await page.getByLabel("Verification Code").fill(issuedCode);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.waitForURL(expectedUrl, { timeout: 15_000 });
  await expect
    .poll(
      async () => {
        const payload = (await page.evaluate(async () => {
          return fetch("/api/auth/session", {
            credentials: "same-origin",
          }).then((response) => response.json().catch(() => null));
        })) as { user?: { email?: string | null } | null } | null;
        return payload?.user?.email || null;
      },
      { timeout: 15_000 }
    )
    .toBe(email.toLowerCase());
}
