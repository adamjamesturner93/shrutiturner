import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownContent } from "@/components/markdown-content";

describe("public CMS formatting", () => {
  it("preserves travel paragraphs and intentional address line breaks", () => {
    const html = renderToStaticMarkup(
      MarkdownContent({
        children:
          "Driving times:\nStirling — 10 minutes\nEdinburgh — 45 minutes\n\nAddress:\nPowis House\nStirling",
      })
    );
    expect(html.match(/<p /g)).toHaveLength(2);
    expect(html).toContain("Stirling — 10 minutes\nEdinburgh");
    expect(html).toContain("whitespace-pre-line");
  });
  it("renders lists and safe links while escaping raw markup", () => {
    const html = renderToStaticMarkup(
      MarkdownContent({
        children: "- Parking\n- [Map](https://example.test)\n\n<script>bad</script>",
      })
    );
    expect(html).toContain("<ul");
    expect(html).toContain('href="https://example.test"');
    expect(html).not.toContain("<script>");
  });
});
