import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import {
  getBlogEmailCopy,
  DEFAULT_BLOG_EMAIL_INTRODUCTION,
} from "@/lib/newsletter/blog-email-copy";
import BlogPostEmail from "@/emails/blog-post";

describe("optional publication email copy", () => {
  it("keeps existing defaults for older posts and blank fields", () => {
    expect(
      getBlogEmailCopy({ title: "Strength", firstName: "Jo", subject: " ", introduction: "" })
    ).toEqual({
      subject: "New blog post: Strength",
      introduction: DEFAULT_BLOG_EMAIL_INTRODUCTION,
    });
  });
  it("personalises both supported tokens without replacement-string interpolation", () => {
    expect(
      getBlogEmailCopy({
        title: "Strength",
        firstName: "$&",
        subject: "For {name}\nToday",
        introduction: "Hello {{firstName}}\n\nYour article",
      })
    ).toEqual({
      subject: "For $& Today",
      introduction: "Hello $&\n\nYour article",
    });
  });
  it("renders introduction paragraphs safely before the excerpt", async () => {
    const html = await render(
      BlogPostEmail({
        introduction: "<script>bad</script>\n\nA second paragraph",
        postExcerpt: "ARTICLE EXCERPT",
      })
    );
    expect(html).not.toContain("<script>bad</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html.indexOf("A second paragraph")).toBeLessThan(html.indexOf("ARTICLE EXCERPT"));
  });
});
