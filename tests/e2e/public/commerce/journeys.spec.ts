import { expect, test } from "@playwright/test";
import {
  cleanupE2ECommerceData,
  createE2EBalanceBooking,
  createE2EProgrammeGift,
  createE2ESmallGroupRun,
} from "../../helpers/commerce";

test.beforeEach(async ({ page }) => {
  await cleanupE2ECommerceData();
  await page.addInitScript(() => {
    window.sessionStorage.setItem("newsletter_shown", "true");
  });
});

test.afterAll(async () => {
  await cleanupE2ECommerceData();
});

test("gift redemption page shows the seeded gift details and sign-in path", async ({ page }) => {
  const programme = await createE2ESmallGroupRun();
  const gift = await createE2EProgrammeGift(programme.id);

  await page.goto(`/gift/redeem/${gift.code}`);

  await expect(page.locator("h1", { hasText: "Shoulder Resilience & Mobility Gift" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in to redeem" })).toBeVisible();
  await expect(page.getByText("Enjoy this programme.")).toBeVisible();
  await expect(page.getByText("Tuesdays at 18:00")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to sign in" })).toHaveAttribute(
    "href",
    `/login?redirect=/gift/redeem/${gift.code}`
  );
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
