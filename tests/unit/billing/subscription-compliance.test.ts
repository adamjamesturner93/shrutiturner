import { describe, expect, it } from "vitest";
import { buildMembershipCheckoutConfirmationCopy } from "@/lib/billing/subscription-compliance";
import {
  ANNUAL_RENEWAL_REMINDER_LEAD_DAYS,
  buildMembershipDisclosure,
  getNoticeTimingSummary,
} from "@/lib/billing/subscription-disclosure";

describe("buildMembershipCheckoutConfirmationCopy", () => {
  it("includes the compliance details required in the checkout confirmation email", () => {
    const copy = buildMembershipCheckoutConfirmationCopy({
      billingInterval: "monthly",
      pricePence: 3500,
      trialEndsAt: new Date("2026-04-17T09:00:00.000Z"),
      immediateStartSummary:
        "Access starts immediately and any refund right is subject to the immediate-start terms.",
    });

    expect(copy.subject).toContain("trial");
    expect(copy.paragraphs.join(" ")).toContain("14-day");
    expect(copy.paragraphs.join(" ")).toContain("2026-04-17");
    expect(copy.paragraphs.join(" ")).toContain("£35.00");
    expect(copy.paragraphs.join(" ")).toContain("Cancel online from your Membership dashboard");
    expect(copy.paragraphs.join(" ")).toContain("immediate-start terms");
  });
});

describe("subscription disclosure renewal reminder copy", () => {
  it("states the required 30-day and 7-day annual renewal reminders", () => {
    expect(ANNUAL_RENEWAL_REMINDER_LEAD_DAYS).toEqual([30, 7]);
    expect(buildMembershipDisclosure("annual").keyItems.join(" ")).toContain(
      "30 days and 7 days before annual renewals"
    );
    expect(getNoticeTimingSummary("annual")).toContain("30 days and 7 days");
  });
});
