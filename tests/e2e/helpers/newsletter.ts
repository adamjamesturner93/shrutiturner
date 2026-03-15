import type { Page } from "@playwright/test";

export const signupCopyResponse = {
  slug: "default",
  hookText: 'Get "5 Yoga Poses That Actually Build Strength" - free:',
  formPlaceholder: "your.email@example.com",
  buttonLabel: "Subscribe",
  successMessage: "You're subscribed! Check your inbox.",
  consentText: "No spam. Unsubscribe anytime.",
  leadMagnetTitle: "5 Yoga Poses That Actually Build Strength",
  popupDescription: "Join the mailing list for research-backed articles.",
};

export async function mockNewsletterSignupCopy(page: Page) {
  await page.route("**/api/content/newsletter-signup", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(signupCopyResponse),
    });
  });
}
