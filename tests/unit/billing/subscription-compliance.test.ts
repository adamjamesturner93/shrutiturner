import { describe, expect, it } from "vitest";
import { buildMembershipCheckoutConfirmationCopy } from "@/lib/billing/subscription-compliance";

describe("buildMembershipCheckoutConfirmationCopy", () => {
  it("includes the compliance details required in the checkout confirmation email", () => {
    const copy = buildMembershipCheckoutConfirmationCopy({
      billingInterval: "monthly",
      pricePence: 2900,
      trialEndsAt: new Date("2026-04-17T09:00:00.000Z"),
      immediateStartSummary:
        "Access starts immediately and any refund right is subject to the immediate-start terms.",
    });

    expect(copy.subject).toContain("trial");
    expect(copy.paragraphs.join(" ")).toContain("14-day");
    expect(copy.paragraphs.join(" ")).toContain("2026-04-17");
    expect(copy.paragraphs.join(" ")).toContain("£29.00");
    expect(copy.paragraphs.join(" ")).toContain("Cancel online from your Membership dashboard");
    expect(copy.paragraphs.join(" ")).toContain("immediate-start terms");
  });
});
