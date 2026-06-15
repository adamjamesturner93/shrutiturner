import React, { Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderInlineMarkdown } from "@/lib/blog/inline-markdown";

describe("renderInlineMarkdown", () => {
  it("renders underscore and asterisk bold markers as strong text", () => {
    const html = renderToStaticMarkup(
      React.createElement(Fragment, null, renderInlineMarkdown("Use __strength__ and **control**."))
    );

    expect(html).toContain("<strong>strength</strong>");
    expect(html).toContain("<strong>control</strong>");
    expect(html).not.toContain("__strength__");
    expect(html).not.toContain("**control**");
  });
});
