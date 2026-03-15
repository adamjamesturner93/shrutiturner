import { expect, test } from "@playwright/test";

test("signup route redirects to login and preserves auth query params", async ({ page }) => {
  await page.goto("/signup?redirect=%2Fgift%2Fredeem%2Fabc123&ref=friend-code&intent=book");

  await expect(page).toHaveURL(
    /\/login\?redirect=%2Fgift%2Fredeem%2Fabc123&ref=friend-code&intent=book$/
  );
});

test("login shows booking intent messaging", async ({ page }) => {
  await page.goto("/login?intent=book");

  await expect(page.getByText("Sign in to complete your booking.")).toBeVisible();
});

test("login shows referral messaging", async ({ page }) => {
  await page.goto("/login?ref=friend-code");

  await expect(
    page.locator("#main-content").getByText("Your free class gift will be added after sign-in.")
  ).toBeVisible();
});

test("login email flow sends a code and advances to the verification step", async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined;

  await page.route("**/api/auth/send-code", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto("/login");
  const mainContent = page.locator("#main-content");
  await mainContent.getByRole("button", { name: "Continue with Email" }).click();
  await mainContent.getByLabel("Email Address").fill("reader@example.com");
  await expect(mainContent.getByTestId("turnstile-bypass")).toBeVisible();
  await mainContent.getByRole("button", { name: "Send Verification Code" }).click();

  await expect(mainContent.getByLabel("Verification Code")).toBeVisible();
  await expect(mainContent.getByText("Code sent to reader@example.com")).toBeVisible();
  expect(requestBody).toMatchObject({
    email: "reader@example.com",
    turnstileToken: "e2e-turnstile-token",
  });
});
