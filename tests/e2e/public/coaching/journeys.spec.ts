import { expect, test } from "@playwright/test";

test("personal programme page shows the refreshed hero and delivery detail", async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("newsletter_shown", "true");
  });

  await page.goto("/coaching/personal-programme");

  await expect(
    page.getByRole("heading", {
      name: /Expert programming for people who want structure without weekly calls\./i,
    })
  ).toBeVisible();
  await expect(page.getByText("Delivered in Everfit")).toBeVisible();
  await expect(page.getByRole("heading", { name: "A lower-touch route with real structure behind it." })).toBeVisible();
});

test("coaching application submits the selected tier and answers", async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined;

  await page.addInitScript(() => {
    window.sessionStorage.setItem("newsletter_shown", "true");
  });

  await page.route("**/api/coaching/applications", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, id: "coaching-application-1" }),
    });
  });

  await page.goto("/coaching/apply?tier=coaching");

  await expect(page.getByRole("heading", { name: "Apply for higher-touch support" })).toBeVisible();
  await page.getByLabel("Name *").fill("Taylor Jordan");
  await page.getByLabel("Email *").fill("taylor@example.com");
  await page
    .getByLabel("What do you want training or coaching to support right now? *")
    .fill("I want more confidence training consistently without flare setbacks.");
  await page
    .getByLabel("What symptoms, conditions, injuries, or complexity should we know about? *")
    .fill("Psoriatic arthritis, fatigue, and a history of overdoing it on better days.");
  await page
    .getByLabel("What is your current training experience? *")
    .fill("I do a little yoga and walking, but I struggle to progress on my own.");
  await page.locator("#supportLevel").selectOption("high");
  await page
    .getByLabel("Anything we should know about your schedule, energy, or capacity? *")
    .fill("My energy is best in the mornings and worse after busy work weeks.");
  await page.locator("#membership").selectOption("new");
  await page
    .getByLabel("Why does higher-touch coaching feel relevant right now?")
    .fill("I need closer calibration and accountability while rebuilding trust in training.");
  await page.getByLabel(/I have read and agree to the/i).check();

  await page.getByRole("button", { name: "Submit Application" }).click();

  await expect(page.getByRole("heading", { name: "What happens next" })).toBeVisible();
  expect(requestBody).toMatchObject({
    applicantFirstName: "Taylor",
    applicantLastName: "Jordan",
    applicantEmail: "taylor@example.com",
    tier: "coaching",
    agreedToCoachingAgreement: true,
  });
  expect(requestBody?.answers).toMatchObject({
    goals: "I want more confidence training consistently without flare setbacks.",
    conditions: "Psoriatic arthritis, fatigue, and a history of overdoing it on better days.",
    trainingExperience: "I do a little yoga and walking, but I struggle to progress on my own.",
    supportLevel: "high",
    availability: "My energy is best in the mornings and worse after busy work weeks.",
    membership: "new",
    coachingContext: "I need closer calibration and accountability while rebuilding trust in training.",
  });
});
