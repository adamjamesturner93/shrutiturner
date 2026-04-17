import type { Page } from "@playwright/test";

const NEWSLETTER_SIGNUP_COPY = {
  slug: "default",
  hookText: 'Get "Why Some Bodies Need Strength Before More Stretching" - free:',
  formPlaceholder: "your.email@example.com",
  buttonLabel: "Subscribe",
  successMessage: "Please check your inbox to confirm your email address.",
  consentText: "No spam. Unsubscribe anytime.",
  popupTitle: "Get Evidence-Based Insights",
  popupDescription:
    "Join the mailing list for launch updates, practical strength guidance, and occasional offers. No spam, unsubscribe anytime.",
};

export async function mockNewsletterSignupCopy(page: Page) {
  await page.route("**/api/content/newsletter-signup", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(NEWSLETTER_SIGNUP_COPY),
    });
  });
}
