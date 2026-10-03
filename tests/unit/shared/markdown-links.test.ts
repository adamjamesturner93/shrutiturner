import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import NewsletterEmail from "@/emails/newsletter";
import { renderInlineMarkdown } from "@/lib/blog/inline-markdown";
import { parseMarkdownLinkDestination } from "@/lib/content/markdown-link";

const url = "https://www.shrutiturner.co.uk/retreats/the-middle-ground";
const markdown = `[Come join me](${url} "The Middle Ground")`;

describe("Markdown link destinations", () => {
  it.each(['"The Middle Ground"', "'The Middle Ground'", "(The Middle Ground)"])(
    "separates optional title %s",
    (title) => {
      expect(parseMarkdownLinkDestination(`${url} ${title}`)).toEqual({
        href: url,
        title: "The Middle Ground",
      });
    }
  );
  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "//evil.example",
    "https://example.com wrong trailing text",
    "/\\evil.example",
  ])("rejects unsafe or malformed destination %s", (value) => {
    expect(parseMarkdownLinkDestination(value)).toBeNull();
  });
  it.each([
    "/retreats?date=one#book",
    "#booking",
    "mailto:hello@example.com",
    "https://example.com/a_(b)?x=1&y=2",
    "https://example.com/a%20b",
  ])("preserves valid destination %s", (href) => {
    expect(parseMarkdownLinkDestination(href)?.href).toBe(href);
  });
  it("supports angle bracket destinations", () => {
    expect(parseMarkdownLinkDestination(`<${url}> "Title"`)).toEqual({ href: url, title: "Title" });
  });
  it("renders website links with a separate title attribute", () => {
    const html = renderToStaticMarkup(
      createElement(Fragment, null, renderInlineMarkdown(markdown))
    );
    expect(html).toContain(`href="${url}"`);
    expect(html).toContain('title="The Middle Ground"');
    expect(html).toContain(">Come join me</a>");
  });
  it("keeps email HTML and plain-text targets free of the title", async () => {
    const email = createElement(NewsletterEmail, { bodyContent: markdown });
    const html = await render(email);
    const text = await render(email, { plainText: true });
    expect(html).toContain(`href="${url}"`);
    expect(html).toContain('title="The Middle Ground"');
    expect(text).toContain(url);
    expect(text).not.toContain(`${url} "`);
    expect(html).not.toContain("%22");
    expect(text).not.toContain("%22");
  });
  it("renders unsafe links as harmless text in both contexts", async () => {
    const input = "[Bad](javascript:alert(1))";
    const html = await render(createElement(NewsletterEmail, { bodyContent: input }));
    expect(html).not.toContain('href="javascript:');
    expect(renderToStaticMarkup(createElement(Fragment, null, renderInlineMarkdown(input)))).toBe(
      "Bad"
    );
  });
});
