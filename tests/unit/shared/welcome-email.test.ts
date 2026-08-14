import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import WelcomeEmail from "@/emails/welcome";

describe("WelcomeEmail", () => {
  it("points subscribers to current blog and 1:1 offer routes", async () => {
    const html = await render(
      WelcomeEmail({
        firstName: "Rhea",
        offersUrl: "https://shrutiturner.test/coaching",
        blogUrl: "https://shrutiturner.test/blog",
        privacyUrl: "https://shrutiturner.test/privacy",
      })
    );

    expect(html).toContain("Read the blog");
    expect(html).toContain("Explore 1:1 offers");
    expect(html).toContain("https://shrutiturner.test/blog");
    expect(html).toContain("https://shrutiturner.test/coaching");
    expect(html).not.toContain("/classes");
    expect(html).not.toContain("/about");
  });
});
