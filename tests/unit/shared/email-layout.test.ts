import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import ClassBookingEmail from "@/emails/class-booking";
import NewsletterEmail from "@/emails/newsletter";

describe("EmailLayout categories", () => {
  it("renders the shared branded header", async () => {
    const html = await render(
      ClassBookingEmail({
        firstName: "Taylor",
        className: "Adaptive Strength",
      })
    );

    expect(html).toContain("/logos/logo-white-horizontal.svg");
    expect(html).toContain('alt="Shruti Turner Private Studio"');
  });

  it("does not render unsubscribe content for transactional emails", async () => {
    const html = await render(
      ClassBookingEmail({
        firstName: "Taylor",
        className: "Adaptive Strength",
      })
    );

    expect(html).not.toContain("Unsubscribe");
    expect(html).not.toContain("signed up at shrutiturner.com");
  });

  it("renders unsubscribe content for marketing emails", async () => {
    const html = await render(
      NewsletterEmail({
        firstName: "Taylor",
        subject: "Monthly note",
      })
    );

    expect(html).toContain("Unsubscribe");
    expect(html).toContain("signed up at shrutiturner.com");
  });
});
