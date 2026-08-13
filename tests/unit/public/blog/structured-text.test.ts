import { describe, expect, it } from "vitest";
import { parseBlogPostBody, parseLegalDocumentBody } from "@/lib/content/structured-text";

describe("structured text parsing", () => {
  it("removes a duplicate article title and preserves semantic content blocks", () => {
    const blocks = parseBlogPostBody(
      `# A useful article

Opening paragraph.

## First section

- One point
- Another point

1. First step
2. Second step`,
      "A useful article"
    );

    expect(blocks).toEqual([
      { type: "paragraph", text: "Opening paragraph." },
      { type: "heading", level: 2, text: "First section" },
      { type: "unordered-list", items: ["One point", "Another point"] },
      { type: "ordered-list", items: ["First step", "Second step"] },
    ]);
  });

  it("turns numbered legal sections and bullets into semantic blocks", () => {
    expect(
      parseLegalDocumentBody(`1. About these terms

This is the introduction.

- First responsibility
- Second responsibility`)
    ).toEqual([
      { type: "heading", level: 2, text: "1. About these terms" },
      { type: "paragraph", text: "This is the introduction." },
      {
        type: "unordered-list",
        items: ["First responsibility", "Second responsibility"],
      },
    ]);
  });
});
