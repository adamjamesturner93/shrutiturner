import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import {
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";
import { loginWithEmail, makeE2eAuthEmail } from "../../helpers/auth";

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

test("partially completed onboarding resumes at the next required step", async ({ page }) => {
  const email = makeE2eAuthEmail("onboarding-resume");

  await db.user.create({
    data: {
      email,
      firstName: "Jamie",
      lastName: "Resume",
      dob: new Date("1988-02-10"),
      acceptedTermsVersion: CURRENT_TERMS_VERSION,
      acceptedHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
      isOnboarded: false,
    },
  });

  await loginWithEmail(page, email);

  await expect(page).toHaveURL(/\/dashboard(\?onboarding=true)?$/);
  await expect(page.getByRole("heading", { name: "Where Did You Hear About Me?" })).toBeVisible();

  await page.getByRole("radio", { name: "Instagram" }).check();
  await page.getByRole("button", { name: "Next: Tell Us About Your Body" }).click();

  await expect(page.getByRole("heading", { name: "Your Health Profile" })).toBeVisible();
  await page.getByLabel("Hip").check();
  await page
    .getByRole("checkbox", { name: /I agree to Shruti Turner using the health information/i })
    .check();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Welcome, Jamie." })).toBeVisible();
});

test("first-time login can finish onboarding with nothing relevant to share right now", async ({
  page,
}) => {
  const email = makeE2eAuthEmail("onboarding-nothing-to-declare");

  await loginWithEmail(page, email);

  await page.getByLabel("First name").fill("Avery");
  await page.getByLabel("Last name").fill("Clear");
  await page.getByLabel("Date of birth").fill("1986-05-12");
  await page.getByRole("button", { name: "Save & Continue" }).click();

  await page.getByRole("checkbox", { name: /Terms & Conditions/i }).check();
  await page.getByRole("checkbox", { name: /Health & Liability Waiver/i }).check();
  await page.getByRole("button", { name: "Accept & Continue" }).click();

  await page.getByRole("radio", { name: "Friend or family" }).check();
  await page.getByRole("button", { name: "Next: Tell Us About Your Body" }).click();

  await expect(page.getByRole("heading", { name: "Your Health Profile" })).toBeVisible();
  await page.getByRole("checkbox", { name: "Nothing relevant to share right now." }).check();
  await page
    .getByRole("checkbox", {
      name: /I agree to Shruti Turner using the health information/i,
    })
    .check();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Welcome, Avery." })).toBeVisible();
  await page.getByRole("button", { name: "Enter Studio" }).click();

  await page.goto("/dashboard/health");
  await expect(page.getByText("Nothing relevant is recorded right now.")).toBeVisible();
});

test("skipping health during onboarding lands on the dashboard with a health declaration prompt", async ({
  page,
}) => {
  const email = makeE2eAuthEmail("onboarding-skip-health");

  await loginWithEmail(page, email);

  await page.getByLabel("First name").fill("Riley");
  await page.getByLabel("Last name").fill("Skipped");
  await page.getByLabel("Date of birth").fill("1988-09-21");
  await page.getByRole("button", { name: "Save & Continue" }).click();

  await page.getByRole("checkbox", { name: /Terms & Conditions/i }).check();
  await page.getByRole("checkbox", { name: /Health & Liability Waiver/i }).check();
  await page.getByRole("button", { name: "Accept & Continue" }).click();

  await page.getByRole("radio", { name: "Google search" }).check();
  await page.getByRole("button", { name: "Next: Tell Us About Your Body" }).click();

  await expect(page.getByRole("heading", { name: "Your Health Profile" })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByText("Complete your health declaration before you book or join classes.")
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete health declaration" })).toBeVisible();
});
