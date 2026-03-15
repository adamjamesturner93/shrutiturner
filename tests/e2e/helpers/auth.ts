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

export async function loginWithEmail(page: Page, email: string, code = "123456") {
  await preparePasswordlessCode(email, code);
  await page.goto("/login");
  const csrfToken = await page.evaluate(async () => {
    const payload = (await fetch("/api/auth/csrf", {
      credentials: "same-origin",
    }).then((response) => response.json())) as { csrfToken?: string };
    return payload.csrfToken || "";
  });

  await page.evaluate(
    ({ signInEmail, signInCode, signInCsrfToken }) => {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/auth/callback/credentials";

      for (const [name, value] of [
        ["csrfToken", signInCsrfToken],
        ["email", signInEmail],
        ["authCode", signInCode],
        ["callbackUrl", `${window.location.origin}/dashboard`],
      ]) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    },
    {
      signInEmail: email,
      signInCode: code,
      signInCsrfToken: csrfToken,
    }
  );

  await page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 15_000 });
  await expect
    .poll(
      async () => {
        const payload = (await page.evaluate(async () => {
          return fetch("/api/auth/session", {
            credentials: "same-origin",
          }).then((response) => response.json().catch(() => null));
        })) as
          | { user?: { email?: string | null } | null }
          | null;
        return payload?.user?.email || null;
      },
      { timeout: 15_000 }
    )
    .toBe(email.toLowerCase());
}
