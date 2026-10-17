import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "@/components/markdown-content";

describe("retreat Markdown", () => {
  it("renders Contentful underscores as bold and preserves paragraph structure", () => {
    const html = renderToStaticMarkup(
      createElement(
        MarkdownContent,
        null,
        "__You don't need to start again every September.__\n\nMove at *your own pace*."
      )
    );
    expect(html).toContain("<strong>You don&#x27;t need to start again every September.</strong>");
    expect(html).toMatch(/<p(?: [^>]*)?>Move at <em>your own pace<\/em>\.<\/p>/);
    expect(html).not.toContain("__");
  });

  it("renders each schedule activity as an icon-led list item", () => {
    const html = renderToStaticMarkup(
      createElement(
        MarkdownContent,
        { activityList: true },
        "- Arrive and settle in\n- **Gentle movement**\n- Dinner together"
      )
    );
    expect(html.match(/<li /g)).toHaveLength(3);
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(3);
    expect(html).toContain("<strong>Gentle movement</strong>");
    expect(html).not.toContain("list-disc");
  });

  it("renders headings and lists without accepting HTML or executable links", () => {
    const html = renderToStaticMarkup(
      createElement(
        MarkdownContent,
        null,
        "## What to expect\n\n- **Movement**\n- Rest\n\n1. Arrive\n2. Settle\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))"
      )
    );
    expect(html).toContain("<h2");
    expect(html).toContain("<li><strong>Movement</strong></li>");
    expect(html).toContain("<ol");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript:');
  });
});
