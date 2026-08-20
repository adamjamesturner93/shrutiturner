import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoadingRegion } from "@/components/loading-region";
import { PendingButton } from "@/components/pending-button";
import { Skeleton } from "@/components/ui/skeleton";

describe("loading experience primitives", () => {
  it("announces one busy loading region and hides its decorative content", () => {
    const markup = renderToStaticMarkup(
      createElement(
        LoadingRegion,
        { label: "Loading retreat details" },
        createElement("div", null, "Decorative placeholder")
      )
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-label="Loading retreat details"');
    expect(markup).toContain('aria-hidden="true"');
  });

  it("uses a muted, decorative skeleton by default", () => {
    const markup = renderToStaticMarkup(createElement(Skeleton, { className: "h-8" }));

    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("bg-muted");
    expect(markup).not.toContain("bg-accent ");
  });

  it("disables and identifies a pending action", () => {
    const markup = renderToStaticMarkup(
      createElement(
        PendingButton,
        { pending: true, pendingLabel: "Posting comment…" },
        "Post comment"
      )
    );

    expect(markup).toContain("disabled");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Posting comment…");
    expect(markup).not.toContain(">Post comment<");
  });
});
