import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";
import {
  loginWithEmail,
  makeE2eAuthEmail,
} from "../../helpers/auth";

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

  let currentState = createMembershipState();

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
  await expect(page).toHaveURL(/\/dashboard\/membership\?checkout=success$/);
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
