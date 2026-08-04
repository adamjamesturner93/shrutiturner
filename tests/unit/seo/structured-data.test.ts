import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/app-url", () => ({
  buildAbsoluteUrl: (path: string) => `https://shrutiturner.co.uk${path}`,
}));

const {
  createBlogSchema,
  createBreadcrumbListSchema,
  createClassCourseSchema,
  createFaqPageSchema,
  createOrganizationSchema,
  createRetreatEventSchema,
  createRetreatEventSchemas,
  createRetreatItemListSchema,
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

  it("builds class, blog, retreat, FAQ and breadcrumb schemas", () => {
    expect(
      createClassCourseSchema({
        id: "class_1",
        slug: "adaptive-strength",
        name: "Adaptive Strength",
        type: "Strength",
        day: "Monday",
        time: "10:00",
        duration: "45 min",
        level: "All levels",
        maxSpaces: 12,
        shortDescription: "Strength class",
        longDescription: "Long description",
        whatToExpect: [],
        whoItsFor: [],
        equipment: [],
        benefits: [],
        instructor: "Shruti Turner",
        seoTitle: "Adaptive Strength",
        seoDescription: "Strength class",
        seoKeywords: "strength",
      })
    ).toMatchObject({
      "@type": "Course",
      url: "https://shrutiturner.co.uk/classes/adaptive-strength",
    });

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
            addons: [],
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

    const retreat = {
      id: "retreat_2",
      slug: "autumn-retreat",
      title: "Autumn Retreat",
      subtitle: "Two dates",
      location: "Scotland",
      imageUrl: "",
      shortDescription: "Retreat",
      fullDescription: "Retreat description",
      dates: [
        {
          id: "date_1",
          startDate: "2026-09-01",
          endDate: "2026-09-03",
          availableSpaces: 4,
          totalSpaces: 10,
          roomOptions: [],
          addons: [],
        },
        {
          id: "date_2",
          startDate: "2026-10-01",
          endDate: "2026-10-03",
          availableSpaces: 2,
          totalSpaces: 10,
          roomOptions: [],
          addons: [],
        },
      ],
      earlyBirdPrice: 100,
      earlyBirdDeadline: "2026-08-01",
      normalPrice: 200,
      currency: "GBP",
      included: [],
      notIncluded: [],
      schedule: [],
      accommodation: "Shared rooms",
      suitableFor: [],
    };

    expect(createRetreatEventSchemas(retreat)).toHaveLength(2);
    expect(createRetreatEventSchemas(retreat)[1]).toMatchObject({
      "@type": "Event",
      startDate: "2026-10-01",
    });
    expect(createRetreatItemListSchema([retreat])).toMatchObject({
      "@type": "ItemList",
      itemListElement: [
        expect.objectContaining({
          position: 1,
          url: "https://shrutiturner.co.uk/retreats/autumn-retreat",
        }),
      ],
    });

    expect(
      createFaqPageSchema([{ slug: "faq", question: "Question?", answer: "Answer." }])
    ).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [expect.objectContaining({ "@type": "Question" })],
    });

    const breadcrumbs = createBreadcrumbListSchema([
      { name: "Home", path: "/" },
      { name: "Classes", path: "/classes" },
    ]);
    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbs.itemListElement).toEqual([
      expect.objectContaining({ position: 1 }),
      expect.objectContaining({ position: 2 }),
    ]);
  });
});
