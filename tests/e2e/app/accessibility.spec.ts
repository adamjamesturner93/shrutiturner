import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";
import { loginWithEmail, makeE2eAuthEmail } from "../helpers/auth";
import { formatAxeViolations, getAxeViolations, waitForPageToSettle } from "../helpers/a11y";

async function seedCompleteMember(email: string) {
  const user = await db.user.create({
    data: {
      email,
      firstName: "Avery",
      lastName: "Accessible",
      dob: new Date("1990-05-19"),
      heardAboutSource: "google",
      isOnboarded: true,
      acceptedTermsVersion: CURRENT_TERMS_VERSION,
      acceptedHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
      hasConsentedToHealthData: true,
      acceptedHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
    },
  });

  await db.healthProfile.create({
    data: {
      userId: user.id,
    },
  });
}

test("signed-in account, membership, and health routes do not introduce axe violations", async ({
  page,
}) => {
  const email = makeE2eAuthEmail("a11y-member");
  await seedCompleteMember(email);
  await loginWithEmail(page, email);

  for (const route of ["/dashboard/account", "/dashboard/membership", "/dashboard/health"]) {
    await page.goto(route);
    await waitForPageToSettle(page);
    const violations = await getAxeViolations(page);
    expect(violations, formatAxeViolations(route, violations)).toEqual([]);
  }
});

test("onboarding modal remains accessible while a member finishes setup", async ({ page }) => {
  const email = makeE2eAuthEmail("a11y-onboarding");
  await db.user.create({
    data: {
      email,
    },
  });

  await loginWithEmail(page, email);
  await page.goto("/dashboard?onboarding=true");
  await expect(page.getByRole("heading", { name: "Complete Your Profile" })).toBeVisible();

  await waitForPageToSettle(page);
  const violations = await getAxeViolations(page);
  expect(violations, formatAxeViolations("/dashboard?onboarding=true", violations)).toEqual([]);
});
