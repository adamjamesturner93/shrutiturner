import { describe, expect, it } from "vitest";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumbs";

describe("breadcrumb structured data", () => {
  it("builds ordered BreadcrumbList JSON-LD from public breadcrumb items", () => {
    expect(
      buildBreadcrumbJsonLd([
        { name: "Home", href: "/" },
        { name: "Blog", href: "/blog" },
        { name: "Article", href: "/blog/article" },
      ])
    ).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://shrutiturner.co.uk/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: "https://shrutiturner.co.uk/blog",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Article",
          item: "https://shrutiturner.co.uk/blog/article",
        },
      ],
    });
  });
});
