import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";
import {
  cleanupE2eAuthUsers,
  loginWithEmail,
  makeE2eAuthEmail,
} from "../../helpers/auth";

test.beforeEach(async () => {
  await cleanupE2eAuthUsers();
});

test.afterAll(async () => {
  await cleanupE2eAuthUsers();
});

test("account page saves profile and preference updates while keeping email disabled", async ({
  page,
}) => {
  const email = makeE2eAuthEmail("account-profile");
  await db.user.create({
    data: {
      email,
      firstName: "Casey",
      lastName: "Reader",
      dob: new Date("1990-04-12"),
      gender: "prefer_not_to_say",
      ethnicity: "prefer_not_to_say",
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY",
      isOnboarded: true,
      acceptedTermsVersion: CURRENT_TERMS_VERSION,
      acceptedHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
      hasConsentedToHealthData: true,
      acceptedHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
    },
  });

  await loginWithEmail(page, email);
  await page.goto("/dashboard/account");

  await expect(page.getByRole("heading", { name: "Account Settings" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeDisabled();

  await page.getByLabel("First Name").fill("Taylor");
  await page.getByLabel("Last Name").fill("Updated");
  await page.getByLabel("Date of Birth").fill("1989-02-14");
  await page.getByRole("button", { name: "Save Profile" }).click();
  await expect(page.getByText("Saved")).toBeVisible();

  await page.getByRole("button", { name: "Preferences" }).click();
  await page.locator("#timezone").click();
  await page.getByRole("option", { name: /New York/ }).click();
  await page.locator("#dateFormat").click();
  await page.getByRole("option", { name: /MM\/DD\/YYYY/ }).click();
  await page.getByRole("button", { name: "Save Preferences" }).click();
  await expect(page.getByText("Saved")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("First Name")).toHaveValue("Taylor");
  await expect(page.getByLabel("Last Name")).toHaveValue("Updated");
  await expect(page.getByLabel("Date of Birth")).toHaveValue("1989-02-14");

  await page.getByRole("button", { name: "Preferences" }).click();
  await expect(page.locator("#timezone")).toContainText("New York");
  await expect(page.locator("#dateFormat")).toContainText("MM/DD/YYYY");
});

test("health profile can be updated from the signed-in health page and persists on reload", async ({
  page,
}) => {
  const email = makeE2eAuthEmail("health-profile");
  await db.user.create({
    data: {
      email,
      firstName: "Morgan",
      lastName: "Member",
      dob: new Date("1991-06-06"),
      isOnboarded: true,
      acceptedTermsVersion: CURRENT_TERMS_VERSION,
      acceptedHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
      hasConsentedToHealthData: true,
      acceptedHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
    },
  });

  await loginWithEmail(page, email);
  await page.goto("/dashboard/health");

  await expect(page.getByRole("heading", { name: "Health Profile" })).toBeVisible();
  await page.getByRole("button", { name: "Add your conditions" }).click();
  await page.getByRole("button", { name: "Physical Health" }).click();
  await page.getByLabel("Autoimmune condition").check();
  await page
    .getByPlaceholder(/rheumatoid arthritis, lupus, psoriatic arthritis, MS/i)
    .fill("Psoriatic arthritis affecting lower back and hips.");
  await page
    .getByPlaceholder(/I have morning stiffness for ~30 mins/i)
    .fill("Prefers to begin with a gentler warmup.");
  await page.getByRole("button", { name: "Save Health Profile" }).click();

  await expect(page.getByText("Autoimmune condition")).toBeVisible();
  await expect(page.getByText("Psoriatic arthritis affecting lower back and hips.")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Autoimmune condition")).toBeVisible();
  await expect(page.getByText("Prefers to begin with a gentler warmup.")).toBeVisible();
});
