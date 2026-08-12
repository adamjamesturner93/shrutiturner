import { createElement } from "react";
import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import OnboardingEmail from "@/emails/onboarding";

describe("OnboardingEmail account welcome", () => {
  it("uses first-time account-ready copy when there is no 1:1 application", async () => {
    const html = await render(
      createElement(OnboardingEmail, {
        firstName: "Rhea",
        offersUrl: "https://shrutiturner.test/coaching",
        applyUrl: "https://shrutiturner.test/coaching/apply",
      })
    );

    expect(html).toContain("Your studio account is ready");
    expect(html).toContain("Your account is now set up");
    expect(html).toContain("Explore 1:1 offers");
    expect(html).not.toContain("You&#x27;ve been here for a few days now");
  });

  it("points existing 1:1 applicants to their dashboard instead of applying again", async () => {
    const html = await render(
      createElement(OnboardingEmail, {
        firstName: "Rhea",
        dashboardUrl: "https://shrutiturner.test/dashboard/coaching",
        healthUrl: "https://shrutiturner.test/dashboard/health",
        hasOneToOneApplication: true,
      })
    );

    expect(html).toContain("track your 1:1 application");
    expect(html).toContain("Open your 1:1 dashboard");
    expect(html).toContain("https://shrutiturner.test/dashboard/coaching");
    expect(html).toContain("https://shrutiturner.test/dashboard/health");
    expect(html).not.toContain("Review the current 1:1 offers");
  });
});
