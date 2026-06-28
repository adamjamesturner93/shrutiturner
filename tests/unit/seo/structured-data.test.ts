import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/app-url", () => ({
  buildAbsoluteUrl: (path: string) => `https://shrutiturner.co.uk${path}`,
}));

const {
  createBlogSchema,
  createBreadcrumbListSchema,
  createFaqPageSchema,
  createOrganizationSchema,
  createRetreatEventSchema,
  createServiceSchema,
  createWebPageSchema,
  createWebSiteSchema,
} = await import("@/lib/seo/structured-data");

describe("structured data helpers", () => {
  it("builds homepage organization and website schemas", () => {
    expect(createOrganizationSchema()).toMatchObject({
      "@type": "Organization",
      name: "Shruti Turner",
      url: "https://shrutiturner.co.uk/",
    });
    expect(createWebSiteSchema()).toMatchObject({
      "@type": "WebSite",
      publisher: { "@type": "Organization", name: "Shruti Turner" },
    });
  });

  it("builds service and page schemas with canonical URLs", () => {
    expect(
      createWebPageSchema({
        name: "Coaching",
        path: "/coaching",
        description: "Coaching description",
      })
    ).toMatchObject({
      "@type": "WebPage",
      url: "https://shrutiturner.co.uk/coaching",
    });

    expect(
      createServiceSchema({
        name: "Coaching",
        path: "/coaching",
        description: "Coaching description",
        serviceType: "Health coaching",
      })
    ).toMatchObject({
      "@type": "Service",
      serviceType: "Health coaching",
      provider: { "@type": "Person", name: "Shruti Turner" },
    });
  });

  it("builds blog, retreat, FAQ and breadcrumb schemas", () => {
    expect(
      createBlogSchema({
        posts: [{ id: "post", title: "Post", excerpt: "Excerpt", date: "2026-04-01" }],
      })
    ).toMatchObject({
      "@type": "Blog",
      blogPost: [expect.objectContaining({ "@type": "BlogPosting" })],
    });

    expect(
      createRetreatEventSchema({
        id: "retreat_1",
        slug: "spring-retreat",
        title: "Spring Retreat",
        subtitle: "Spring reset",
        location: "Wales",
        imageUrl: "",
        shortDescription: "Retreat",
        fullDescription: "Retreat description",
        dates: [
          {
            id: "date_1",
            startDate: "2026-05-01",
            endDate: "2026-05-03",
            availableSpaces: 4,
            totalSpaces: 12,
            roomOptions: [],
          },
        ],
        earlyBirdPrice: 100,
        earlyBirdDeadline: "2026-03-01",
        normalPrice: 200,
        currency: "GBP",
        included: [],
        notIncluded: [],
        schedule: [],
        accommodation: "Shared rooms",
        suitableFor: [],
      })
    ).toMatchObject({
      "@type": "Event",
      startDate: "2026-05-01",
    });

    expect(
      createFaqPageSchema([{ slug: "faq", question: "Question?", answer: "Answer." }])
    ).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [expect.objectContaining({ "@type": "Question" })],
    });

    const breadcrumbs = createBreadcrumbListSchema([
      { name: "Home", path: "/" },
      { name: "1:1 Offers", path: "/coaching" },
    ]);
    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbs.itemListElement).toEqual([
      expect.objectContaining({ position: 1 }),
      expect.objectContaining({ position: 2 }),
    ]);
  });
});
