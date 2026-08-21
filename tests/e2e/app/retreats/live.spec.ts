import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { AcceptanceType, AuthChallengePurpose } from "@prisma/client";
import { db } from "../../helpers/db";
import { makeE2eAuthEmail } from "../../helpers/auth";

const PREFIX = "e2e-retreat-live-";

async function cleanup() {
  await db.retreatBooking.deleteMany({
    where: { retreatDate: { externalDateId: { startsWith: PREFIX } } },
  });
  await db.retreatDate.deleteMany({ where: { externalDateId: { startsWith: PREFIX } } });
  await db.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
}

async function signInThroughUi(
  page: import("@playwright/test").Page,
  email: string,
  redirect: string
) {
  const code = "123456";
  await page.route("**/api/auth/send-code", async (route) => {
    await db.authChallenge.deleteMany({ where: { email } });
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
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);
  const main = page.locator("#main-content");
  await main.getByRole("button", { name: "Continue with Email" }).click();
  await main.getByLabel("Email Address").fill(email);
  await main.getByRole("button", { name: "Send Verification Code" }).click();
  await main.getByLabel("Verification Code").fill(code);
  await main.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(redirect, { timeout: 20_000 });
}

test.beforeEach(cleanup);
test.afterAll(cleanup);

test("emailed deep link preserves the full destination through sign-in", async ({ page }) => {
  await page.goto("/dashboard/retreats/booking-from-email/live?source=reminder");
  await expect(page).toHaveURL(/\/login\?/);
  const redirect = new URL(page.url()).searchParams.get("redirect");
  expect(redirect).toBe("/dashboard/retreats/booking-from-email/live?source=reminder");
});

test("an entitled attendee sees the timezone-aware scheduled landing and calendar action", async ({
  page,
}) => {
  const email = `${PREFIX}${makeE2eAuthEmail("scheduled").split("@")[0]}@example.com`;
  const user = await db.user.create({
    data: {
      email,
      firstName: "Asha",
      lastName: "Khan",
      emailVerified: new Date(),
      dob: new Date("1990-01-01T00:00:00.000Z"),
      isOnboarded: true,
      healthProfile: {
        create: { declarationStatus: "none_declared", lastConfirmedAt: new Date() },
      },
    },
  });
  const policies = await db.policyDocumentVersion.findMany({
    where: {
      isCurrent: true,
      type: {
        in: [AcceptanceType.terms, AcceptanceType.health_waiver, AcceptanceType.health_data],
      },
    },
  });
  expect(policies).toHaveLength(3);
  await db.acceptanceEvent.createMany({
    data: policies.map((policy) => ({
      userId: user.id,
      actorUserId: user.id,
      type: policy.type,
      policyVersionId: policy.id,
      version: policy.version,
      acceptanceSurface: "retreat_live_e2e",
      acceptedAt: new Date(),
    })),
  });
  const startsAt = new Date(Date.now() + 2 * 60 * 60_000);
  const retreatDate = await db.retreatDate.create({
    data: {
      externalDateId: `${PREFIX}${crypto.randomUUID()}`,
      retreatSlug: `${PREFIX}scheduled`,
      retreatTitleSnapshot: "Calm Online Retreat",
      retreatLocationSnapshot: "Online",
      retreatType: "online",
      timezone: "Europe/London",
      startsAt,
      endsAt: new Date(startsAt.getTime() + 2 * 60 * 60_000),
      capacity: 30,
      pricePence: 10000,
      depositAmountPence: 10000,
      status: "open",
    },
  });
  const booking = await db.retreatBooking.create({
    data: {
      retreatDateId: retreatDate.id,
      purchaserUserId: user.id,
      attendeeUserId: user.id,
      purchaserFirstName: "Asha",
      purchaserLastName: "Khan",
      purchaserEmail: email,
      attendeeFirstName: "Asha",
      attendeeLastName: "Khan",
      attendeeEmail: email,
      phone: "07000000000",
      emergencyContactName: "Support Person",
      emergencyContactPhone: "07000000001",
      totalPricePence: 10000,
      depositAmountPence: 10000,
      balanceAmountPence: 0,
      depositPaidPence: 10000,
      paymentStatus: "paid_in_full",
      bookingStatus: "paid_in_full",
    },
  });
  await db.retreatOnlineAccessEntitlement.create({
    data: {
      bookingId: booking.id,
      retreatDateId: retreatDate.id,
      userId: user.id,
      attendeeEmail: email,
      accessType: "live_and_replay",
      liveAccessEnabled: true,
      liveAccessStartsAt: new Date(startsAt.getTime() - 30 * 60_000),
      liveAccessEndsAt: new Date(startsAt.getTime() + 4 * 60 * 60_000),
    },
  });

  const destination = `/dashboard/retreats/${booking.id}/live`;
  await signInThroughUi(page, email, destination);
  await expect(page.getByRole("heading", { name: "Calm Online Retreat" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("link", { name: "Add to calendar" })).toHaveAttribute(
    "href",
    `/api/retreats/bookings/${booking.id}/calendar`
  );
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    axe.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""))
  ).toEqual([]);
});
