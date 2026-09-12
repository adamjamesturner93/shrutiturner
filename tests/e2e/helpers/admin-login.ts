import { createHash } from "node:crypto";
import type { Page } from "@playwright/test";
import { db } from "./db";

/** Local authentication challenge; never sends an email. The caller owns user cleanup. */
export async function signInAdminFixture(page: Page, email: string, path: string) {
  await page.route("**/api/auth/send-code", async (route) => {
    await db.authChallenge.create({
      data: {
        email,
        purpose: "login",
        codeHash: createHash("sha256")
          .update(`${process.env.AUTH_SECRET || "development-auth-secret"}:123456`)
          .digest("hex"),
        expiresAt: new Date(Date.now() + 600_000),
        maxAttempts: 3,
      },
    });
    await route.fulfill({ json: { success: true } });
  });
  await page.goto(`/login?redirect=${encodeURIComponent(path)}`);
  const main = page.locator("#main-content");
  await main.getByRole("button", { name: "Continue with Email" }).click();
  await main.getByLabel("Email Address").fill(email);
  await main.getByRole("button", { name: "Send Verification Code" }).click();
  await main.getByLabel("Verification Code").fill("123456");
  await main.getByRole("button", { name: "Continue", exact: true }).click({ noWaitAfter: true });
  await page.waitForURL((url) => `${url.pathname}${url.search}` === path, { timeout: 30_000, waitUntil: "commit" });
}
