import { createHash } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { AuthChallengePurpose, PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

const smokeEmail = "e2e-passwordless-session@example.com";
const smokeCode = "123456";
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL || "",
  }),
});

function hashAuthCode(code: string) {
  return createHash("sha256")
    .update(`${process.env.AUTH_SECRET || "development-auth-secret"}:${code}`)
    .digest("hex");
}

async function cleanup() {
  await db.authChallenge.deleteMany({ where: { email: smokeEmail } });
  await db.user.deleteMany({ where: { email: smokeEmail } });
}

test.beforeEach(async () => {
  await cleanup();
});

test.afterEach(async ({ page }) => {
  await page.close();
  await cleanup();
});

test.afterAll(async () => {
  await db.$disconnect();
});

test("passwordless sign-in establishes a readable session for a new email", async ({ page }) => {
  await page.route("**/api/auth/send-code", async (route) => {
    await db.authChallenge.create({
      data: {
        email: smokeEmail,
        purpose: AuthChallengePurpose.signup,
        codeHash: hashAuthCode(smokeCode),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        maxAttempts: 3,
        metadataJson: {
          source: "e2e_passwordless_session",
        },
      },
    });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          sent: true,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          retryAfterSeconds: 0,
        },
      }),
    });
  });

  await page.goto("/login");
  const mainContent = page.locator("#main-content");
  await mainContent.getByRole("button", { name: "Continue with Email" }).click();
  await mainContent.getByLabel("Email Address").fill(smokeEmail);
  await mainContent.getByRole("button", { name: "Send Verification Code" }).click();
  await mainContent.getByLabel("Verification Code").fill(smokeCode);
  await mainContent.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  const sessionResponse = await page.request.get("/api/auth/session");
  expect(sessionResponse.ok()).toBe(true);
  const session = (await sessionResponse.json()) as {
    user?: {
      email?: string | null;
      id?: string | null;
    } | null;
  };

  expect(session.user?.email).toBe(smokeEmail);
  expect(session.user?.id).toBeTruthy();
});
