import { expect, test } from "@playwright/test";
import { db } from "../../helpers/db";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";
import { loginWithEmail, makeE2eAuthEmail } from "../../helpers/auth";

const pricingPayload = {
  currency: "GBP",
  source: "fallback" as const,
  membership: {
    movewell: 29,
  },
  membershipDisplay: {
    movewellMonthly: 29,
    movewellAnnual: 290,
    trialDays: 14,
  },
  credits: {
    1: 9,
    3: 24,
    10: 70,
  },
  creditsExpiryDays: 90,
};

function createMembershipState(options?: {
  active?: boolean;
  cancelAtPeriodEnd?: boolean;
  status?: "active" | "paused" | "cancelled" | "expired" | "past_due";
  endsAt?: string | null;
  credits?: number;
}) {
  const active = options?.active ?? true;
  const status = options?.status ?? (active ? "active" : "cancelled");
  const credits = options?.credits ?? 2;

  return {
    membership: {
      id: "membership_123",
      plan: "movewell" as const,
      billingInterval: "monthly" as const,
      isAnnual: false,
      status,
      label: "Move Well Membership",
      renewalDate: active ? "2026-05-01" : null,
      endsAt: options?.endsAt ?? (options?.cancelAtPeriodEnd ? "2026-05-01" : null),
      classesPerWeek: 99,
      classesUsedThisWeek: 2,
      classesRemaining: 97,
      pricePence: 2900,
      cancelAtPeriodEnd: options?.cancelAtPeriodEnd ?? false,
      accessActive: active,
      compliance: {
        disclosureVersion: "2026-04-03",
        disclosureAcceptedAt: "2026-04-03T10:00:00.000Z",
        inInitialCoolingOff: false,
        inRenewalCoolingOff: false,
        trialEndsAt: "2026-04-17",
        initialCoolingOffEndsAt: "2026-04-17",
        renewalCoolingOffEndsAt: null,
        renewalCoolingOffKind: null,
      },
    },
    credits: {
      balance: credits,
      summary:
        credits > 0
          ? [
              {
                sourceId: "bundle_3",
                sourceLabel: "3-class pack",
                remaining: credits,
                expiresAt: "2026-04-12",
              },
            ]
          : [],
    },
    referral: {
      balancePence: 1000,
    },
    complianceHistory: [],
  };
}

function createAccountResponse(overrides?: {
  hasAgreedToTerms?: boolean;
  hasAgreedToHealth?: boolean;
  hasConsentedToHealthData?: boolean;
  acceptedTermsVersion?: string | null;
  acceptedHealthWaiverVersion?: string | null;
  acceptedHealthDataConsentVersion?: string | null;
  needsTermsReacceptance?: boolean;
  needsHealthWaiverReacceptance?: boolean;
  needsHealthDataConsentRefresh?: boolean;
}) {
  return {
    profile: {
      id: "account_user_1",
      firstName: "Taylor",
      lastName: "Member",
      name: "Taylor Member",
      email: "taylor@example.com",
      isCoachingClient: false,
      hasHealthProfile: true,
      healthDeclarationStatus: "context_declared" as const,
      healthDeclarationLastConfirmedAt: "2026-04-01T10:00:00.000Z",
      healthDeclarationNeedsReview: false,
      tracksFlareCheckIns: true,
      dob: "1990-03-14",
      gender: null,
      ethnicity: null,
      timezone: "Europe/London",
      dateFormat: "DD/MM/YYYY",
      isOnboarded: true,
      hasAgreedToTerms: overrides?.hasAgreedToTerms ?? true,
      hasAgreedToHealth: overrides?.hasAgreedToHealth ?? true,
      termsAgreedAt: "2026-04-01T10:00:00.000Z",
      healthAgreedAt: "2026-04-01T10:00:00.000Z",
      acceptedTermsVersion: overrides?.acceptedTermsVersion ?? CURRENT_TERMS_VERSION,
      acceptedHealthWaiverVersion:
        overrides?.acceptedHealthWaiverVersion ?? CURRENT_HEALTH_WAIVER_VERSION,
      currentTermsVersion: CURRENT_TERMS_VERSION,
      currentHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
      needsTermsReacceptance: overrides?.needsTermsReacceptance ?? false,
      needsHealthWaiverReacceptance: overrides?.needsHealthWaiverReacceptance ?? false,
      hasConsentedToHealthData: overrides?.hasConsentedToHealthData ?? true,
      healthDataConsentedAt: "2026-04-01T10:00:00.000Z",
      acceptedHealthDataConsentVersion:
        overrides?.acceptedHealthDataConsentVersion ?? CURRENT_HEALTH_DATA_CONSENT_VERSION,
      currentHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
      needsHealthDataConsentRefresh: overrides?.needsHealthDataConsentRefresh ?? false,
      heardAboutSource: "google",
      heardAboutDetail: null,
      onboarding: {
        isComplete: true,
        checklistComplete: true,
        nextStep: "complete" as const,
        missingSteps: [],
      },
    },
    notifications: {
      userId: "account_user_1",
      classReminders: true,
      scheduleUpdates: true,
      programAnnouncements: true,
      marketingEmails: false,
      updatedAt: "2026-04-01T10:00:00.000Z",
    },
    referral: {
      referralCode: "TESTCODE",
      referralLink: "http://127.0.0.1:3001/referrals/TESTCODE",
      referralCount: 0,
      referralEarnedPence: 0,
      referralBalancePence: 0,
      history: [],
    },
  };
}

async function seedMember(email: string) {
  const user = await db.user.create({
    data: {
      email,
      firstName: "Taylor",
      lastName: "Member",
      dob: new Date("1990-03-14"),
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

test("membership page opens the billing portal from the active membership state", async ({
  page,
  baseURL,
}) => {
  const email = makeE2eAuthEmail("membership-portal");
  await seedMember(email);

  const currentState = createMembershipState();

  await page.route("**/api/me/membership", async (route) => {
    await route.fulfill({ json: currentState });
  });
  await page.route("**/api/me/billing-history?limit=30", async (route) => {
    await route.fulfill({
      json: [
        {
          id: "history_1",
          createdAt: "2026-03-20T12:00:00.000Z",
          kind: "membership_charge",
          description: "Move Well Membership",
          amountPence: 2900,
          status: "paid",
        },
      ],
    });
  });
  await page.route("**/api/public/pricing", async (route) => {
    await route.fulfill({ json: pricingPayload });
  });
  await page.route("**/api/me/billing/portal", async (route) => {
    await route.fulfill({
      json: {
        portalUrl: new URL("/dashboard/account", baseURL).toString(),
      },
    });
  });

  await loginWithEmail(page, email);
  await page.goto("/dashboard/membership");

  await expect(page.getByRole("heading", { name: "Membership & Credits" })).toBeVisible();
  await page.getByRole("button", { name: "Manage billing details" }).click();
  await expect(page).toHaveURL(/\/dashboard\/account$/);
});

test("membership page can cancel and resume a scheduled cancellation", async ({ page }) => {
  const email = makeE2eAuthEmail("membership-cancel");
  await seedMember(email);

  let currentState = createMembershipState({ active: true, credits: 2 });

  await page.route("**/api/me/membership", async (route) => {
    await route.fulfill({ json: currentState });
  });
  await page.route("**/api/me/billing-history?limit=30", async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route("**/api/public/pricing", async (route) => {
    await route.fulfill({ json: pricingPayload });
  });
  await page.route("**/api/me/membership/cancel", async (route) => {
    currentState = createMembershipState({
      active: true,
      cancelAtPeriodEnd: true,
      endsAt: "2026-05-01",
      credits: 2,
    });
    await route.fulfill({ json: { membership: currentState.membership } });
  });
  await page.route("**/api/me/membership/resume", async (route) => {
    currentState = createMembershipState({ active: true, credits: 2 });
    await route.fulfill({ json: { membership: currentState.membership } });
  });

  await loginWithEmail(page, email);
  await page.goto("/dashboard/membership");

  await page.getByRole("button", { name: "Cancel membership" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel Membership" }).click();
  await expect(page.getByText("scheduled to end on 2026-05-01")).toBeVisible();

  await page.getByRole("button", { name: "Resume renewal" }).click();
  await expect(page.getByRole("button", { name: "Cancel membership" })).toBeVisible();
  await expect(page.getByText("scheduled to end on 2026-05-01")).toHaveCount(0);
});

test("membership checkout starts from the purchase state", async ({ page, baseURL }) => {
  const email = makeE2eAuthEmail("membership-checkout");
  await seedMember(email);

  await page.route("**/api/me/membership", async (route) => {
    await route.fulfill({
      json: {
        membership: null,
        credits: { balance: 0, summary: [] },
        referral: { balancePence: 0 },
        complianceHistory: [],
      },
    });
  });
  await page.route("**/api/me/billing-history?limit=30", async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route("**/api/public/pricing", async (route) => {
    await route.fulfill({ json: pricingPayload });
  });
  await page.route("**/api/me/membership/checkout", async (route) => {
    await route.fulfill({
      json: {
        checkoutUrl: new URL("/dashboard/membership?checkout=success", baseURL).toString(),
      },
    });
  });

  await loginWithEmail(page, email);
  await page.goto("/dashboard/membership");

  await page.getByRole("button", { name: /Start Monthly/i }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Acknowledge and continue" }).click();
  await expect(page).toHaveURL(/\/dashboard\/membership\?checkout=success$/);
});

test("membership checkout can recover from a legal acceptance conflict", async ({
  page,
  baseURL,
}) => {
  const email = makeE2eAuthEmail("membership-acceptance-refresh");
  await seedMember(email);

  let checkoutAttempts = 0;

  await page.route("**/api/me/membership", async (route) => {
    await route.fulfill({
      json: {
        membership: null,
        credits: { balance: 0, summary: [] },
        referral: { balancePence: 0 },
        complianceHistory: [],
      },
    });
  });
  await page.route("**/api/me/billing-history?limit=30", async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route("**/api/public/pricing", async (route) => {
    await route.fulfill({ json: pricingPayload });
  });
  await page.route("**/api/me", async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        json: createAccountResponse({
          hasAgreedToTerms: true,
          hasAgreedToHealth: true,
          hasConsentedToHealthData: true,
        }),
      });
      return;
    }

    await route.fulfill({
      json: createAccountResponse({
        hasAgreedToTerms: true,
        hasAgreedToHealth: true,
        hasConsentedToHealthData: true,
      }),
    });
  });
  await page.route("**/api/me/membership/checkout", async (route) => {
    checkoutAttempts += 1;

    if (checkoutAttempts === 1) {
      await route.fulfill({
        status: 409,
        json: {
          code: "LEGAL_ACCEPTANCE_REQUIRED",
          requiredAcceptances: [
            {
              type: "terms",
              surface: "membership_checkout",
              currentVersion: CURRENT_TERMS_VERSION,
              acceptedVersion: "2025-10-01",
              policyVersionId: "policy_terms_current",
              acceptanceEventId: "event_terms_legacy",
              isCurrent: false,
            },
            {
              type: "health_waiver",
              surface: "membership_checkout",
              currentVersion: CURRENT_HEALTH_WAIVER_VERSION,
              acceptedVersion: "2025-10-01",
              policyVersionId: "policy_health_current",
              acceptanceEventId: "event_health_legacy",
              isCurrent: false,
            },
          ],
        },
      });
      return;
    }

    await route.fulfill({
      json: {
        checkoutUrl: new URL("/dashboard/membership?checkout=success", baseURL).toString(),
      },
    });
  });

  await loginWithEmail(page, email);
  await page.goto("/dashboard/membership");

  await page.getByRole("button", { name: /Start Monthly/i }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Acknowledge and continue" }).click();
  await expect(page.getByText("Updated agreements are required before checkout.")).toBeVisible();

  await page.getByRole("button", { name: "Accept agreements and continue" }).click();
  await expect(page).toHaveURL(/\/dashboard\/membership\?checkout=success$/);
});

test("membership checkout shows the stale disclosure message instead of a generic error", async ({
  page,
}) => {
  const email = makeE2eAuthEmail("membership-stale-disclosure");
  await seedMember(email);

  await page.route("**/api/me/membership", async (route) => {
    await route.fulfill({
      json: {
        membership: null,
        credits: { balance: 0, summary: [] },
        referral: { balancePence: 0 },
        complianceHistory: [],
      },
    });
  });
  await page.route("**/api/me/billing-history?limit=30", async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route("**/api/public/pricing", async (route) => {
    await route.fulfill({ json: pricingPayload });
  });
  await page.route("**/api/me/membership/checkout", async (route) => {
    await route.fulfill({
      status: 409,
      json: {
        message: "Subscription disclosure is out of date. Refresh and review it again.",
      },
    });
  });

  await loginWithEmail(page, email);
  await page.goto("/dashboard/membership");

  await page.getByRole("button", { name: /Start Monthly/i }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Acknowledge and continue" }).click();
  await expect(
    page.getByText("Subscription disclosure is out of date. Refresh and review it again.")
  ).toBeVisible();
});

test("credit checkout starts from the purchase state", async ({ page, baseURL }) => {
  const email = makeE2eAuthEmail("credits-checkout");
  await seedMember(email);

  await page.route("**/api/me/membership", async (route) => {
    await route.fulfill({
      json: {
        membership: null,
        credits: { balance: 0, summary: [] },
        referral: { balancePence: 0 },
        complianceHistory: [],
      },
    });
  });
  await page.route("**/api/me/billing-history?limit=30", async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route("**/api/public/pricing", async (route) => {
    await route.fulfill({ json: pricingPayload });
  });
  await page.route("**/api/me/credits/checkout", async (route) => {
    await route.fulfill({
      json: {
        checkoutUrl: new URL("/dashboard/membership?checkout=success", baseURL).toString(),
      },
    });
  });

  await loginWithEmail(page, email);
  await page.goto("/dashboard/membership");

  await page.getByRole("button", { name: /10-Pack/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/membership\?checkout=success$/);
});
