import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import CoachingApplicationApprovedEmail from "@/emails/coaching-application-approved";
import CoachingApplicationConfirmationEmail from "@/emails/coaching-application-confirmation";
import CoachingApplicationRejectedEmail from "@/emails/coaching-application-rejected";
import CoachingApplicationWaitlistedEmail from "@/emails/coaching-application-waitlisted";
import CoachingPackageChangeRequestedEmail from "@/emails/coaching-package-change-requested";
import NewsletterEmail from "@/emails/newsletter";

describe("current email copy", () => {
  it("renders active 1:1 lifecycle emails without stale studio or coaching-dashboard language", async () => {
    const dashboardUrl = "https://shrutiturner.test/dashboard/coaching";
    const html = [
      await render(
        CoachingApplicationConfirmationEmail({
          firstName: "Rhea",
          tierLabel: "Guided Training Plan",
          dashboardUrl,
        })
      ),
      await render(
        CoachingApplicationApprovedEmail({
          firstName: "Rhea",
          tierLabel: "Guided Training Plan",
          dashboardUrl,
        })
      ),
      await render(
        CoachingApplicationRejectedEmail({
          firstName: "Rhea",
          tierLabel: "Guided Training Plan",
          decisionReason: "This is not the right fit right now.",
          dashboardUrl,
        })
      ),
      await render(
        CoachingApplicationWaitlistedEmail({
          firstName: "Rhea",
          tierLabel: "Guided Training Plan",
          dashboardUrl,
        })
      ),
      await render(
        CoachingPackageChangeRequestedEmail({
          firstName: "Rhea",
          fromLabel: "Guided Training Plan",
          toLabel: "1:1 Coaching",
          effectiveMode: "next_invoice",
          dashboardUrl,
        })
      ),
    ].join("\n");

    expect(html).toContain("1:1");
    expect(html).not.toContain("Private Studio");
    expect(html).not.toContain("coaching dashboard");
    expect(html).not.toContain("coaching package");
    expect(html).not.toContain("coaching payment");
    expect(html).not.toContain("coaching waiting list");
  });

  it("keeps newsletter fallback content class-neutral", async () => {
    const html = await render(
      NewsletterEmail({
        firstName: "Rhea",
        subject: "Newsletter preview",
      })
    );

    expect(html).not.toContain("new class");
    expect(html).not.toContain("trusted studio");
    expect(html).not.toContain("Private Studio");
  });
});
