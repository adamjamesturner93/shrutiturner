import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("@/components/layout", () => ({
  Layout: ({ children }: { children: ReactNode }) => createElement("main", null, children),
}));
vi.mock("@/components/public-breadcrumbs", () => ({ PublicBreadcrumbs: () => null }));
import { LegalDocumentPage } from "@/views/legal-document";
import { withAnalyticsPolicy } from "@/lib/analytics/policy";
it("renders A-05 as a semantic table with column headers and unchanged wording", () => {
  const document = withAnalyticsPolicy(
    {
      id: "cookies",
      slug: "cookies",
      title: "Cookie Policy",
      version: "test",
      body: "## 5. Analytics\n\nOriginal words.\n\n## 6. Managing cookies\n\nExisting controls.",
    },
    "2026-10-18"
  );
  const html = renderToStaticMarkup(createElement(LegalDocumentPage, { document }));
  expect(html).toContain("<table");
  expect(html.match(/scope="col"/g)).toHaveLength(3);
  expect(html).toContain("Analytics storage and durations</h3>");
  expect(html).toContain(
    "Up to 180 days from the recorded event, or sooner if analytics consent is withdrawn or browser storage is cleared."
  );
  expect(html).toContain("cookie expires up to 180 days after creation.");
  expect(html).toContain("cookie expires up to 180 days after its latest update.");
  expect(html).not.toContain("without automatically extending");
  expect(html).toContain("Original words.");
  expect(html).toContain("Existing controls.");
  expect(html).not.toContain("|---|");
});
