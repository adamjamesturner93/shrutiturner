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

  await expect(
    mainContent.getByRole("heading", { name: /Start with a question, not a sales call\./i })
  ).toBeVisible();
  await expect(mainContent.getByTestId("turnstile-bypass")).toBeVisible();

  await mainContent.getByLabel("First name *").fill("Taylor");
  await mainContent.getByLabel("Last name *").fill("Jordan");
  await mainContent.getByLabel("Email address *").fill("taylor@example.com");
  await mainContent.locator("#interest").click();
  await page.getByRole("option", { name: "Retreats" }).click();
  await mainContent.getByLabel("Your message *").fill(
    "I want to ask whether the retreat pace would suit a fluctuating condition."
  );

  await mainContent.getByRole("button", { name: "Send Enquiry" }).click();

  await expect(page.getByRole("heading", { name: "Thank you, Taylor." })).toBeVisible();
  expect(requestBody).toMatchObject({
    firstName: "Taylor",
    lastName: "Jordan",
    email: "taylor@example.com",
    interest: "retreat",
    message: "I want to ask whether the retreat pace would suit a fluctuating condition.",
    turnstileToken: "e2e-turnstile-token",
    honeypot: "",
  });
});
