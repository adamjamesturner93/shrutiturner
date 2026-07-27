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

  it("renders mapped Contentful links as anchors", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Fragment,
        null,
        renderInlineMarkdown(
          "Photo by [Ambitious Studio | Rick Barrett](https://unsplash.com/@weareambitious?utm_source=unsplash&utm_medium=referral)"
        )
      )
    );

    expect(html).toContain(
      'href="https://unsplash.com/@weareambitious?utm_source=unsplash&amp;utm_medium=referral"'
    );
    expect(html).toContain(">Ambitious Studio | Rick Barrett</a>");
  });
});
