import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mockNewsletterSignupCopy } from "../../helpers/newsletter";

test.beforeEach(async ({ page }) => {
  await mockNewsletterSignupCopy(page);
});

test("subscribe page submits the lead-magnet form with the expected source", async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined;

  await page.route("**/api/newsletter/subscribe", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, message: "You're subscribed! Check your inbox." }),
    });
  });

  await page.goto("/subscribe");
  const mainContent = page.locator("#main-content");
  await expect(
    mainContent.getByRole("heading", {
      name: "Practical ideas for moving, training and feeling stronger.",
    })
  ).toBeVisible();
  await expect(
    mainContent.getByRole("img", { name: "Shruti Turner smiling while hiking in Patagonia" })
  ).toBeVisible();
  await expect(
    mainContent.getByRole("heading", { name: "Useful notes, not filler." })
  ).toBeVisible();
  for (const benefit of [
    "Practical explanations of movement, strength and wellbeing",
    "Ideas you can adapt to your goals, capacity and real life",
    "New articles and first access to retreats and workshops",
  ]) {
    await expect(mainContent.getByText(benefit, { exact: true })).toBeVisible();
  }
  await expect(mainContent.locator(".marketing-grid")).toHaveCount(0);
  await expect(mainContent.getByText("Inside the emails", { exact: true })).toHaveCount(0);
  await expect(mainContent.getByText("Practical, useful emails", { exact: true })).toHaveCount(0);
  await expect(mainContent.getByRole("heading", { name: "Join the newsletter." })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Explore" })).toBeVisible();
  await expect(page.locator("footer input")).toHaveCount(0);
  await expect(mainContent).not.toContainText("fluctuating bodies");
  await expect(mainContent).not.toContainText("PhD Biomechanics");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex,\s*follow/i
  );
  await expect(mainContent.getByTestId("turnstile-bypass")).toBeVisible();
  const accessibilityResults = await new AxeBuilder({ page })
    .include("#main-content")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibilityResults.violations).toEqual([]);

  await mainContent.getByLabel("First name").fill("Taylor");
  await mainContent.getByLabel("Email address").fill("taylor@example.com");
  await mainContent.getByRole("checkbox").check();
  await expect(mainContent.getByRole("button", { name: "Join the newsletter" })).toBeEnabled();
  await mainContent.getByRole("button", { name: "Join the newsletter" }).click();

  await expect(page.getByRole("heading", { name: "Check your inbox." })).toBeVisible();
  await expect(
    page.getByText(/Your free guide will arrive straight after confirmation/i)
  ).toBeVisible();
  expect(requestBody).toMatchObject({
    firstName: "Taylor",
    email: "taylor@example.com",
    source: "subscribe",
    turnstileToken: "e2e-turnstile-token",
    consent: true,
    marketingOptIn: true,
  });
});

test("homepage footer signup submits with the footer source", async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined;

  await page.addInitScript(() => {
    window.sessionStorage.setItem("newsletter_shown", "true");
  });

  await page.route("**/api/newsletter/subscribe", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, message: "You're subscribed! Check your inbox." }),
    });
  });

  await page.goto("/");
  const footer = page.locator("footer");
  await footer.getByPlaceholder("Your first name").fill("Jordan");
  await footer.getByPlaceholder("your.email@example.com").fill("jordan@example.com");
  await footer.getByRole("checkbox").check();
  await expect(footer.getByRole("button", { name: "Subscribe" })).toBeEnabled();
  await footer.getByRole("button", { name: "Subscribe" }).click();

  await expect(
    footer.getByText("Please check your inbox to confirm your email address.")
  ).toBeVisible();
  expect(requestBody).toMatchObject({
    firstName: "Jordan",
    email: "jordan@example.com",
    source: "footer",
    turnstileToken: "e2e-turnstile-token",
  });
});

test("manual unsubscribe requires confirmation and then shows the secure-link state", async ({
  page,
}) => {
  let requestBody: Record<string, unknown> | undefined;

  await page.route("**/api/newsletter/unsubscribe", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        requested: true,
        message: "If that email is subscribed, we have sent a secure unsubscribe link.",
      }),
    });
  });

  await page.goto("/unsubscribe?email=reader@example.com");
  await expect(page.locator("footer input[type='email']")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Email preferences" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Are you sure?" })).toBeVisible();
  await page.getByRole("button", { name: "Email Me the Link" }).click();

  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  expect(requestBody).toMatchObject({
    email: "reader@example.com",
  });
});

test("token unsubscribe auto-processes on page load", async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined;

  await page.route("**/api/newsletter/unsubscribe", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, email: "reader@example.com" }),
    });
  });

  await page.goto("/unsubscribe?token=test-token");

  await expect(page.getByRole("heading", { name: "You've been unsubscribed" })).toBeVisible();
  expect(requestBody).toMatchObject({
    token: "test-token",
  });
});
