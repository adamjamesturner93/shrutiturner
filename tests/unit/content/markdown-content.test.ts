import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "@/components/markdown-content";

describe("retreat Markdown", () => {
  it("renders Contentful underscores as bold and preserves paragraph structure", () => {
    const html = renderToStaticMarkup(
      createElement(MarkdownContent, {
        children: "__You don't need to start again every September.__\n\nMove at *your own pace*.",
      })
    );
    expect(html).toContain("<strong>You don&#x27;t need to start again every September.</strong>");
    expect(html).toContain("<p>Move at <em>your own pace</em>.</p>");
    expect(html).not.toContain("__");
  });

  it("renders headings and lists without accepting HTML or executable links", () => {
    const html = renderToStaticMarkup(
      createElement(MarkdownContent, {
        children:
          "## What to expect\n\n- **Movement**\n- Rest\n\n1. Arrive\n2. Settle\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))",
      })
    );
    expect(html).toContain("<h2");
    expect(html).toContain("<li><strong>Movement</strong></li>");
    expect(html).toContain("<ol");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript:');
  });
});
