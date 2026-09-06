import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { AuthChallengePurpose } from "@prisma/client";
import type { Page } from "@playwright/test";
import { db } from "../../helpers/db";

const MIDDLE_GROUND_DATE_TIME = "09:30-12:00 4th October 2026";
const EMAIL_PREFIX = "e2e-admin-retreat-date-times-";

async function signInAsAdmin(page: Page, email: string) {
  const code = "123456";
  await page.route("**/api/auth/send-code", async (route) => {
    await db.authChallenge.create({
      data: {
        email,
        purpose: AuthChallengePurpose.login,
        codeHash: createHash("sha256")
          .update(`${process.env.AUTH_SECRET || "development-auth-secret"}:${code}`)
          .digest("hex"),
        expiresAt: new Date(Date.now() + 10 * 60_000),
        maxAttempts: 3,
      },
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto("/login?redirect=%2Fadmin%2Fretreats");
  const main = page.locator("#main-content");
  await main.getByRole("button", { name: "Continue with Email" }).click();
  await main.getByLabel("Email Address").fill(email);
  await main.getByRole("button", { name: "Send Verification Code" }).click();
  await main.getByLabel("Verification Code").fill(code);
  await main.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("/admin/retreats", { timeout: 20_000 });
}

async function cleanup() {
  await db.authChallenge.deleteMany({ where: { email: { startsWith: EMAIL_PREFIX } } });
  await db.user.deleteMany({ where: { email: { startsWith: EMAIL_PREFIX } } });
}

test.beforeEach(cleanup);
test.afterAll(cleanup);

test("admin retreat list and detail show the event-local start and end times", async ({ page }) => {
  const email = `${EMAIL_PREFIX}${Date.now()}@example.com`;
  await db.user.create({
    data: {
      email,
      role: "admin",
      emailVerified: new Date(),
    },
  });
  await signInAsAdmin(page, email);

  const retreatLink = page
    .locator('a[href^="/admin/retreats/"]')
    .filter({ hasText: "The Middle Ground" });

  await expect(retreatLink).toContainText(MIDDLE_GROUND_DATE_TIME);
  await retreatLink.click();

  await expect(page.getByRole("heading", { level: 1, name: "The Middle Ground" })).toBeVisible();
  await expect(page.getByText(MIDDLE_GROUND_DATE_TIME, { exact: true }).first()).toBeVisible();
});
