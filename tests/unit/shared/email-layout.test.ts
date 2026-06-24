import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import BlogPostEmail from "@/emails/blog-post";
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
    expect(html).toContain("https://example.com/recovery.jpg");
    expect(html).toContain("Recovery caption");
    expect(html).not.toContain("Bonnie taking some time");
    expect(html).not.toContain("Private Studio");
  });

  it("does not render malformed newsletter images without a source", async () => {
    const html = await render(
      NewsletterEmail({
        firstName: "Taylor",
        subject: "Monthly note",
        bodyContent: "Thank you.\n\n![Happy Bonnie](undefined)",
      })
    );

    expect(html).not.toContain('alt="Happy Bonnie"');
    expect(html).not.toContain("Happy Bonnie</p>");
  });

  it("normalises protocol-relative Contentful newsletter image URLs", async () => {
    const html = await render(
      NewsletterEmail({
        firstName: "Taylor",
        subject: "Monthly note",
        bodyContent: "![Happy Bonnie](//images.ctfassets.net/space/asset/happy-bonnie.jpg)",
      })
    );

    expect(html).toContain('alt="Happy Bonnie"');
    expect(html).toContain("https://images.ctfassets.net/space/asset/happy-bonnie.jpg");
    expect(html).not.toContain('src="//images.ctfassets.net');
  });

  it("does not use a static fallback image for blog post emails", async () => {
    const html = await render(
      BlogPostEmail({
        firstName: "Taylor",
        postTitle: "A current post",
        postExcerpt: "Current excerpt.",
        postUrl: "https://shrutiturner.test/blog/current-post",
      })
    );

    expect(html).not.toContain("images.unsplash.com");
  });
});
