import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getGlobalContent: vi.fn(),
  getPageSeo: vi.fn(),
  getRuntimePlatformSettings: vi.fn(),
}));

vi.mock("@/lib/content/public-content", () => ({
  getGlobalContent: mocks.getGlobalContent,
  getPageSeo: mocks.getPageSeo,
}));

vi.mock("@/lib/platform/runtime-settings", () => ({
  getRuntimePlatformSettings: mocks.getRuntimePlatformSettings,
}));

vi.mock("@/lib/app-url", () => ({
  buildAbsoluteUrl: (path: string) => `https://shrutiturner.co.uk${path}`,
}));

const { buildLegalDocumentMetadata, buildPageMetadata, buildSeoMetadata } =
  await import("@/lib/content/metadata");

describe("content metadata helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getGlobalContent.mockResolvedValue({
      siteName: "Shruti Turner",
      siteTagline: "Strength & Yoga",
      defaultSeoDescription: "Global description",
    });
    mocks.getPageSeo.mockResolvedValue({
      title: "Contact",
      description: "Contact Shruti Turner",
      keywords: "contact, coaching",
    });
    mocks.getRuntimePlatformSettings.mockResolvedValue({
      businessName: "Shruti Turner",
      defaultSeoDescription: "Platform description",
    });
  });

  it("builds full metadata for configured public pages", async () => {
    const metadata = await buildPageMetadata("contact", "Contact fallback");

    expect(metadata).toMatchObject({
      title: "Contact",
      description: "Contact Shruti Turner",
      keywords: ["contact", "coaching"],
      alternates: { canonical: "https://shrutiturner.co.uk/contact" },
      robots: { index: true, follow: true },
      openGraph: expect.objectContaining({
        title: "Contact",
        url: "https://shrutiturner.co.uk/contact",
      }),
      twitter: expect.objectContaining({
        card: "summary_large_image",
        title: "Contact",
      }),
    });
  });

  it("supports noindex utility metadata", async () => {
    const metadata = await buildSeoMetadata({
      title: "Preview",
      path: "/preview",
      noIndex: true,
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates).toEqual({ canonical: "https://shrutiturner.co.uk/preview" });
  });

  it("supports exact browser titles and distinct social-sharing copy", async () => {
    const metadata = await buildSeoMetadata({
      title: "Personal Training & Movement Coaching | Shruti Turner",
      absoluteTitle: true,
      description: "Search description",
      canonicalUrl: "https://shrutiturner.co.uk/",
      openGraphTitle: "Movement that works with your body | Shruti Turner",
      openGraphDescription: "Social description",
      image: "https://shrutiturner.co.uk/images/home-social-placeholder.jpeg",
      imageAlt: "Shruti Turner strength training",
    });

    expect(metadata).toMatchObject({
      title: { absolute: "Personal Training & Movement Coaching | Shruti Turner" },
      description: "Search description",
      alternates: { canonical: "https://shrutiturner.co.uk/" },
      robots: { index: true, follow: true },
      openGraph: expect.objectContaining({
        title: "Movement that works with your body | Shruti Turner",
        description: "Social description",
        url: "https://shrutiturner.co.uk/",
        images: [
          {
            url: "https://shrutiturner.co.uk/images/home-social-placeholder.jpeg",
            alt: "Shruti Turner strength training",
          },
        ],
      }),
      twitter: expect.objectContaining({
        card: "summary_large_image",
        title: "Movement that works with your body | Shruti Turner",
        description: "Social description",
        images: ["https://shrutiturner.co.uk/images/home-social-placeholder.jpeg"],
      }),
    });
  });

  it("builds legal document metadata with policy keywords", async () => {
    const metadata = await buildLegalDocumentMetadata({
      slug: "privacy",
      title: "Privacy Policy",
      description: "How data is handled.",
    });

    expect(metadata).toMatchObject({
      title: "Privacy Policy",
      description: "How data is handled.",
      alternates: { canonical: "https://shrutiturner.co.uk/privacy" },
      keywords: expect.arrayContaining(["privacy"]),
    });
  });
});
