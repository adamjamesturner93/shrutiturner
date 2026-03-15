import { expect, test } from "@playwright/test";
import { cleanupE2eAuthUsers, loginWithEmail, makeE2eAuthEmail } from "../../helpers/auth";

test.beforeEach(async () => {
  await cleanupE2eAuthUsers();
});

test.afterAll(async () => {
  await cleanupE2eAuthUsers();
});

test("first-time login completes onboarding and persists account and health details", async ({
  page,
}) => {
  const email = makeE2eAuthEmail("onboarding");

  await loginWithEmail(page, email);

  await expect(page).toHaveURL(/\/dashboard(\?onboarding=true)?$/);
  await expect(page.getByRole("heading", { name: "Complete Your Profile" })).toBeVisible();

  await page.getByLabel("First name").fill("Jamie");
  await page.getByLabel("Last name").fill("Starter");
  await page.getByLabel("Date of birth").fill("1987-11-09");
  await page.getByRole("button", { name: "Save & Continue" }).click();

  await expect(page.getByRole("heading", { name: "Before We Begin" })).toBeVisible();
  await page.getByRole("checkbox", { name: /Terms & Conditions/i }).check();
  await page.getByRole("checkbox", { name: /Health & Liability Waiver/i }).check();
  await page.getByRole("button", { name: "Accept & Continue" }).click();

  await expect(page.getByRole("heading", { name: "Where Did You Hear About Me?" })).toBeVisible();
  await page.getByRole("radio", { name: "Google search" }).check();
  await page.getByRole("button", { name: "Next: Tell Us About Your Body" }).click();

  await expect(page.getByRole("heading", { name: "Your Health Profile" })).toBeVisible();
  await page.getByLabel("Back").check();
  await page.getByRole("checkbox", { name: /I agree to Shruti Turner using the health information/i }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Welcome, Jamie." })).toBeVisible();
  await page.getByRole("button", { name: "Enter Studio" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/dashboard/account");
  await expect(page.getByLabel("First Name")).toHaveValue("Jamie");
  await expect(page.getByLabel("Last Name")).toHaveValue("Starter");
  await expect(page.getByLabel("Date of Birth")).toHaveValue("1987-11-09");

  await page.goto("/dashboard/health");
  await expect(page.getByText("Back")).toBeVisible();
});
