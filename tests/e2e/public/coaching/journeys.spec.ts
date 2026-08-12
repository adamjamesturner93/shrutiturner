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
  await expect(
    page.getByRole("heading", { name: "A lower-touch route with real structure behind it." })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Enquire First" })).toBeVisible();
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

  await page.goto("/coaching/apply?offer=one_to_one_coaching");

  await expect(
    page.getByRole("heading", { name: "Enquire about working with Shruti." })
  ).toBeVisible();
  await page.getByLabel("Name *").fill("Taylor Jordan");
  await page.getByLabel("Email *").fill("taylor@example.com");
  await page
    .getByLabel("Do you have a life or sporting event you are training for? *")
    .fill("A 10K race and a hiking trip.");
  await page
    .getByLabel(
      "Please share any chronic or acute injuries or conditions you are living with to help me tailor support for you. *"
    )
    .fill("Psoriatic arthritis, fatigue and a history of overdoing it on better days.");
  await page
    .getByLabel("What does a typical week of activity/work look like for you? *")
    .fill("I work at a desk, walk most days and do one yoga class when energy allows.");
  await page
    .getByLabel(
      "Are there any schedule considerations I should take into account when supporting you? *"
    )
    .fill("My energy is best in the mornings and worse after busy work weeks.");
  await page
    .getByLabel("What equipment or training access do you have? *")
    .fill("Gym access plus resistance bands at home.");
  await page
    .getByLabel("Anything else you would like me to know?")
    .fill("I want support that keeps me consistent without pushing through warning signs.");
  await page.getByLabel("How did you hear about me? *").fill("Instagram.");
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
    trainingEvent: "A 10K race and a hiking trip.",
    conditions: "Psoriatic arthritis, fatigue and a history of overdoing it on better days.",
    typicalWeek: "I work at a desk, walk most days and do one yoga class when energy allows.",
    scheduleConsiderations: "My energy is best in the mornings and worse after busy work weeks.",
    equipment: "Gym access plus resistance bands at home.",
    anythingElse: "I want support that keeps me consistent without pushing through warning signs.",
    heardAbout: "Instagram.",
    offerKey: "one_to_one_coaching",
  });
});
