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

    expect(html).toContain("/logos/logo-white-horizontal-transparent.svg");
    expect(html).toContain('alt="Shruti Turner"');
  });

  it("does not render unsubscribe content for transactional emails", async () => {
    const html = await render(
      ClassBookingEmail({
        firstName: "Taylor",
        className: "Adaptive Strength",
      })
    );

    expect(html).not.toContain("Unsubscribe");
    expect(html).not.toContain("signed up at shrutiturner.co.uk");
  });

  it("renders unsubscribe content for marketing emails", async () => {
    const html = await render(
      NewsletterEmail({
        firstName: "Taylor",
        subject: "Monthly note",
      })
    );

    expect(html).toContain("Unsubscribe");
    expect(html).toContain("signed up at shrutiturner.co.uk");
  });

  it("renders newsletter markdown and images from the Contentful body", async () => {
    const html = await render(
      NewsletterEmail({
        firstName: "Taylor",
        subject: "Monthly note",
        bodyContent:
          "## A useful note\n\nThis is **bold** and [linked](https://example.com).\n\n![Recovery caption](https://example.com/recovery.jpg)\n\n- First point\n- Second point",
      })
    );

    expect(html).toContain("A useful note");
    expect(html).toContain("<strong");
    expect(html).toContain("https://example.com");
    expect(html).toContain('src="https://example.com/recovery.jpg"');
    expect(html).toContain("Recovery caption");
    expect(html).not.toContain("Bonnie taking some time");
    expect(html).not.toContain("Private Studio");
  });

  it("uses the Contentful preview text for the inbox preheader", async () => {
    const html = await render(
      NewsletterEmail({
        firstName: "Taylor",
        subject: "Your routine is allowed to change.",
        previewText: "Adapting your movement is not giving up or getting back on track.",
        bodyContent: "A short newsletter body.",
      })
    );

    expect(html).toContain("Adapting your movement is not giving up or getting back on track.");
  });
});
