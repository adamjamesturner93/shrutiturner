import { expect, test } from "@playwright/test";

test("holding homepage renders the launch page and submits the holding signup source", async ({
  page,
}) => {
  let requestBody: Record<string, unknown> | undefined;

  await page.route("**/api/newsletter/subscribe", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        message: "Please check your inbox to confirm your email address.",
      }),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Something new is coming" })).toBeVisible();
  await expect(page.getByText(/early summer 2026/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Be the first to know" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Subscribe for updates" })).toBeDisabled();

  await page.getByLabel("First name").fill("Taylor");
  await page.getByLabel("Email address").fill("taylor@example.com");
  await page.getByRole("checkbox").check();
  await expect(page.getByTestId("turnstile-bypass")).toBeVisible();
  await expect(page.getByRole("button", { name: "Subscribe for updates" })).toBeEnabled();
  await page.getByRole("button", { name: "Subscribe for updates" }).click();

  await expect(
    page.getByText("Please check your inbox to confirm your email address.")
  ).toBeVisible();
  await expect(page.getByText(/blog/i)).toHaveCount(0);

  expect(requestBody).toMatchObject({
    firstName: "Taylor",
    email: "taylor@example.com",
    source: "holding-page",
    consent: true,
    marketingOptIn: true,
    turnstileToken: "e2e-turnstile-token",
  });
});

test("holding mode redirects blocked public routes back to the homepage", async ({ page }) => {
  await page.goto("/blog");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Something new is coming" })).toBeVisible();
});
