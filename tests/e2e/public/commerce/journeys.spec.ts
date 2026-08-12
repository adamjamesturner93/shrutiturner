import { expect, test } from "@playwright/test";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";
import {
  cleanupE2ECommerceData,
  createE2EBalanceBooking,
  createE2EProgrammeGift,
  createE2ESmallGroupRun,
} from "../../helpers/commerce";
import { loginWithEmail, makeE2eAuthEmail } from "../../helpers/auth";

test.beforeEach(async ({ page }) => {
  await cleanupE2ECommerceData();
  await page.addInitScript(() => {
    window.sessionStorage.setItem("newsletter_shown", "true");
  });
});

test.afterAll(async () => {
  await cleanupE2ECommerceData();
});

function createSignedInAccountPayload() {
  return {
    profile: {
      id: "account_user_1",
      firstName: "Taylor",
      lastName: "Member",
      name: "Taylor Member",
      email: "taylor@example.com",
      isCoachingClient: false,
      hasHealthProfile: true,
      healthDeclarationStatus: "context_declared",
      healthDeclarationLastConfirmedAt: "2026-04-01T10:00:00.000Z",
      healthDeclarationNeedsReview: false,
      tracksFlareCheckIns: true,
      dob: "1990-03-14",
      gender: null,
      ethnicity: null,
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY",
      isOnboarded: true,
      hasAgreedToTerms: true,
      hasAgreedToHealth: true,
      termsAgreedAt: "2026-04-01T10:00:00.000Z",
      healthAgreedAt: "2026-04-01T10:00:00.000Z",
      acceptedTermsVersion: CURRENT_TERMS_VERSION,
      acceptedHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
      currentTermsVersion: CURRENT_TERMS_VERSION,
      currentHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
      needsTermsReacceptance: false,
      needsHealthWaiverReacceptance: false,
      hasConsentedToHealthData: true,
      healthDataConsentedAt: "2026-04-01T10:00:00.000Z",
      acceptedHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
      currentHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
      needsHealthDataConsentRefresh: false,
      heardAboutSource: "google",
      heardAboutDetail: null,
      onboarding: {
        isComplete: true,
        checklistComplete: true,
        nextStep: "complete",
        missingSteps: [],
      },
    },
    notifications: {
      userId: "account_user_1",
      classReminders: true,
      scheduleUpdates: true,
      programAnnouncements: true,
      marketingEmails: false,
      updatedAt: "2026-04-01T10:00:00.000Z",
    },
    referral: {
      referralCode: "TESTCODE",
      referralLink: "http://127.0.0.1:3001/referrals/TESTCODE",
      referralCount: 0,
      referralEarnedPence: 0,
      referralBalancePence: 0,
      history: [],
    },
  };
}

test("gift redemption page shows the seeded gift details and sign-in path", async ({ page }) => {
  const programme = await createE2ESmallGroupRun();
  const gift = await createE2EProgrammeGift(programme.id);

  await page.goto(`/gift/redeem/${gift.code}`);

  await expect(
    page.locator("h1", { hasText: "Shoulder Resilience & Mobility Gift" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in to redeem" })).toBeVisible();
  await expect(page.getByText("Enjoy this programme.")).toBeVisible();
  await expect(page.getByText("Tuesdays at 18:00")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to sign in" })).toHaveAttribute(
    "href",
    `/login?redirect=/gift/redeem/${gift.code}`
  );
});

test("gift redemption shows the authenticated recipient email after profile hydration", async ({
  page,
}) => {
  const email = makeE2eAuthEmail("gift-recipient");
  const programme = await createE2ESmallGroupRun();
  const gift = await createE2EProgrammeGift(programme.id, email);
  await loginWithEmail(page, email);

  await page.goto(`/gift/redeem/${gift.code}`);

  const emailField = page.getByLabel("Email").first();
  await expect(emailField).toHaveValue(email);
  await expect(emailField).toHaveAttribute("readonly", "");
  await expect(page.getByText("This is the email on your signed-in account.")).toBeVisible();
});

test("programme checkout submits the selected run and redirects to checkout", async ({
  page,
  baseURL,
}) => {
  const programme = await createE2ESmallGroupRun();
  let requestBody: Record<string, unknown> | undefined;

  await page.route("**/api/classes/small-group/shoulder-resilience/checkout", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ checkoutUrl: `${baseURL}/e2e-programme-checkout` }),
    });
  });

  await page.route("**/e2e-programme-checkout", async (route) => {
    await route.fulfill({ status: 200, body: "programme checkout ok" });
  });

  await page.goto(`/classes/small-groups/shoulder-resilience/checkout?run=${programme.runSlug}`);

  await expect(page.getByRole("heading", { name: "Join this programme" })).toBeVisible();
  await page.getByLabel("First name").nth(0).fill("Taylor");
  await page.getByLabel("Last name").nth(0).fill("Jordan");
  await page.getByLabel("Email").nth(0).fill("taylor@example.com");
  await page.getByLabel("First name").nth(1).fill("Taylor");
  await page.getByLabel("Last name").nth(1).fill("Jordan");
  await page.getByLabel("Email").nth(1).fill("taylor@example.com");
  await page.getByRole("button", { name: "Continue to checkout" }).click();

  await expect(page).toHaveURL(/e2e-programme-checkout$/);
  expect(requestBody).toMatchObject({
    purchaseMode: "self",
    runSlug: programme.runSlug,
    purchaserFirstName: "Taylor",
    purchaserLastName: "Jordan",
    purchaserEmail: "taylor@example.com",
    attendeeFirstName: "Taylor",
    attendeeLastName: "Jordan",
    attendeeEmail: "taylor@example.com",
  });
});

test("programme checkout retries after signed-in legal reacceptance", async ({ page, baseURL }) => {
  const email = makeE2eAuthEmail("programme-legal");
  const programme = await createE2ESmallGroupRun();
  const accountPayload = createSignedInAccountPayload();
  let checkoutAttempts = 0;
  let acceptancePatchCalls = 0;

  await loginWithEmail(page, email);

  await page.route("**/api/me", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: accountPayload });
      return;
    }

    acceptancePatchCalls += 1;
    await route.fulfill({
      json: {
        profile: {
          hasAgreedToTerms: true,
          hasAgreedToHealth: true,
          acceptedTermsVersion: CURRENT_TERMS_VERSION,
          acceptedHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
          currentTermsVersion: CURRENT_TERMS_VERSION,
          currentHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
          needsTermsReacceptance: false,
          needsHealthWaiverReacceptance: false,
        },
      },
    });
  });

  await page.route("**/api/classes/small-group/shoulder-resilience/checkout", async (route) => {
    checkoutAttempts += 1;
    if (checkoutAttempts === 1) {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          code: "LEGAL_ACCEPTANCE_REQUIRED",
          requiredAcceptances: [
            {
              type: "terms",
              surface: "small_group_checkout",
            },
            {
              type: "health_waiver",
              surface: "small_group_checkout",
            },
          ],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ checkoutUrl: `${baseURL}/e2e-programme-checkout-retry` }),
    });
  });

  await page.route("**/e2e-programme-checkout-retry", async (route) => {
    await route.fulfill({ status: 200, body: "programme checkout ok" });
  });

  await page.goto(`/classes/small-groups/shoulder-resilience/checkout?run=${programme.runSlug}`);

  await page.getByLabel("First name").nth(0).fill("Taylor");
  await page.getByLabel("Last name").nth(0).fill("Jordan");
  await page.getByLabel("Email").nth(0).fill(email);
  await page.getByLabel("First name").nth(1).fill("Taylor");
  await page.getByLabel("Last name").nth(1).fill("Jordan");
  await page.getByLabel("Email").nth(1).fill(email);

  await page.getByRole("button", { name: "Continue to checkout" }).click();
  await expect(
    page.getByText("Updated legal agreements are required before checkout.")
  ).toBeVisible();

  await page.getByRole("button", { name: "Continue to checkout" }).click();
  await expect(page).toHaveURL(/e2e-programme-checkout-retry$/);
  expect(checkoutAttempts).toBe(2);
  expect(acceptancePatchCalls).toBeGreaterThanOrEqual(1);
});

test("retreat checkout gift flow posts the selected retreat details and redirects", async ({
  page,
  baseURL,
}) => {
  let requestBody: Record<string, unknown> | undefined;

  await page.route("**/api/retreats/sankalpa/checkout", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ checkoutUrl: `${baseURL}/e2e-retreat-checkout` }),
    });
  });

  await page.route("**/e2e-retreat-checkout", async (route) => {
    await route.fulfill({ status: 200, body: "retreat checkout ok" });
  });

  await page.goto("/retreats/sankalpa/checkout?gift=1&date=1a&room=1a-shared-twin");

  await expect(page.getByRole("heading", { name: "Gift This Retreat" })).toBeVisible();
  await page.getByLabel("First name").nth(0).fill("Taylor");
  await page.getByLabel("Last name").nth(0).fill("Jordan");
  await page.getByLabel("Email").nth(0).fill("taylor@example.com");
  await page.getByLabel("First name").nth(1).fill("Chris");
  await page.getByLabel("Last name").nth(1).fill("Friend");
  await page.getByLabel("Email").nth(1).fill("chris@example.com");
  await page.getByRole("button", { name: "Continue to gift checkout" }).click();

  await expect(page).toHaveURL(/e2e-retreat-checkout$/);
  expect(requestBody).toMatchObject({
    purchaseMode: "gift",
    retreatDateId: "1a",
    roomOptionId: "1a-shared-twin",
    purchaserFirstName: "Taylor",
    purchaserLastName: "Jordan",
    purchaserEmail: "taylor@example.com",
    recipientFirstName: "Chris",
    recipientLastName: "Friend",
    recipientEmail: "chris@example.com",
  });
});

test("retreat checkout shows a refresh-required message when guest legal versions are stale", async ({
  page,
}) => {
  await page.route("**/api/retreats/sankalpa/checkout", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        code: "GUEST_LEGAL_ACCEPTANCE_REFRESH_REQUIRED",
        message:
          "The retreat legal agreements have changed. Refresh and review the latest versions before continuing.",
      }),
    });
  });

  await page.goto("/retreats/sankalpa/checkout?date=1a&room=1a-shared-twin");

  await page.getByLabel("First name").nth(0).fill("Taylor");
  await page.getByLabel("Last name").nth(0).fill("Jordan");
  await page.getByLabel("Email").nth(0).fill("taylor@example.com");
  await page.getByLabel("First name").nth(1).fill("Taylor");
  await page.getByLabel("Last name").nth(1).fill("Jordan");
  await page.getByLabel("Email").nth(1).fill("taylor@example.com");
  await page.getByLabel("Phone").fill("07123456789");
  await page.getByLabel("Emergency contact name").fill("Alex Jordan");
  await page.getByLabel("Emergency contact phone").fill("07111222333");

  await page.getByRole("button", { name: "Continue to checkout" }).click();

  await expect(
    page.getByText(
      "The retreat legal agreements have changed. Refresh and review the latest versions before continuing."
    )
  ).toBeVisible();
});

test("retreat balance page posts the token and redirects to balance checkout", async ({
  page,
  baseURL,
}) => {
  const booking = await createE2EBalanceBooking();
  let requestBody: Record<string, unknown> | undefined;

  await page.route(`**/api/retreats/bookings/${booking.id}/balance-checkout`, async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ checkoutUrl: `${baseURL}/e2e-balance-checkout` }),
    });
  });

  await page.route("**/e2e-balance-checkout", async (route) => {
    await route.fulfill({ status: 200, body: "balance checkout ok" });
  });

  await page.goto(`/retreats/balance/${booking.balancePaymentUrlToken}`);

  await expect(page.getByRole("heading", { name: "Retreat Balance Payment" })).toBeVisible();
  await expect(page.getByText("£1,350.00")).toBeVisible();
  await page.getByRole("button", { name: "Pay balance now" }).click();

  await expect(page).toHaveURL(/e2e-balance-checkout$/);
  expect(requestBody).toMatchObject({
    token: booking.balancePaymentUrlToken,
  });
});
