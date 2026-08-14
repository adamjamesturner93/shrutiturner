import { expect, test } from "@playwright/test";

test("contact page submits the enquiry form and shows the success state", async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined;

  await page.addInitScript(() => {
    window.sessionStorage.setItem("newsletter_shown", "true");
  });

  await page.route("**/api/contact", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, id: "contact-submission-1" }),
    });
  });

  await page.goto("/contact");
  const mainContent = page.locator("#main-content");

  await expect(mainContent.getByRole("heading", { name: "Get in touch." })).toBeVisible();
  await expect(mainContent.getByTestId("turnstile-bypass")).toBeVisible();

  await mainContent.getByLabel("Name *").fill("Taylor Jordan");
  await mainContent.getByLabel("Email *").fill("taylor@example.com");
  await mainContent.locator("#contact-topic").click();
  await page.getByRole("option", { name: "Workshops, retreats or classes" }).click();
  await mainContent
    .getByLabel("Message *")
    .fill("I want to ask whether the retreat pace would suit a fluctuating condition.");
  await mainContent
    .getByLabel(/I consent to Shruti Turner using the information in this form/i)
    .check();

  await mainContent.getByRole("button", { name: "Send message" }).click();

  await expect(
    page.getByRole("heading", { name: "Thanks — your message has been sent." })
  ).toBeVisible();
  expect(requestBody).toMatchObject({
    firstName: "Taylor",
    lastName: "Jordan",
    email: "taylor@example.com",
    interest: "workshops-retreats-classes",
    message: "I want to ask whether the retreat pace would suit a fluctuating condition.",
    contactConsent: true,
    turnstileToken: "e2e-turnstile-token",
    honeypot: "",
  });
});
