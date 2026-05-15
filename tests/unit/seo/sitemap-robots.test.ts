import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isHoldingStage: vi.fn(),
  getBlogPosts: vi.fn(),
  getClassDefinitions: vi.fn(),
  getRetreatsCombined: vi.fn(),
  getSmallGroupTemplates: vi.fn(),
}));

vi.mock("@/lib/app-url", () => ({
  getBaseSiteUrl: () => "https://shrutiturner.co.uk",
}));

vi.mock("@/lib/site-stage", () => ({
  HOLDING_SITEMAP_PATHS: ["/", "/privacy"],
  isHoldingStage: mocks.isHoldingStage,
}));

vi.mock("@/lib/content", () => ({
  getBlogPosts: mocks.getBlogPosts,
  getClassDefinitions: mocks.getClassDefinitions,
  getRetreatsCombined: mocks.getRetreatsCombined,
  getSmallGroupTemplates: mocks.getSmallGroupTemplates,
}));

const { default: sitemap } = await import("@/app/sitemap");
const { default: robots } = await import("@/app/robots");

function flattenDisallow(rules: ReturnType<typeof robots>["rules"]) {
  const ruleList = Array.isArray(rules) ? rules : [rules];
  return ruleList.flatMap((rule) => rule.disallow || []);
}

describe("sitemap and robots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isHoldingStage.mockReturnValue(false);
    mocks.getBlogPosts.mockResolvedValue([
      {
        id: "blog-post",
        title: "Blog Post",
        excerpt: "",
        content: "",
        authors: [],
        date: "2026-04-01",
        tags: [],
        readTime: "4 min read",
        coverImage: "",
        coverAlt: "",
      },
    ]);
    mocks.getClassDefinitions.mockResolvedValue([{ slug: "adaptive-strength" }]);
    mocks.getSmallGroupTemplates.mockResolvedValue([{ slug: "six-week-reset" }]);
    mocks.getRetreatsCombined.mockResolvedValue([{ slug: "spring-retreat" }]);
  });

  it("lists public static and dynamic routes without non-public routes", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://shrutiturner.co.uk/blog/blog-post");
    expect(urls).toContain("https://shrutiturner.co.uk/classes/adaptive-strength");
    expect(urls).toContain("https://shrutiturner.co.uk/classes/small-groups/six-week-reset");
    expect(urls).toContain("https://shrutiturner.co.uk/retreats/spring-retreat");
    expect(urls).not.toContain("https://shrutiturner.co.uk/admin");
    expect(urls).not.toContain("https://shrutiturner.co.uk/api");
    expect(urls).not.toContain("https://shrutiturner.co.uk/login");
  });

  it("uses the restricted holding sitemap during holding stage", async () => {
    mocks.isHoldingStage.mockReturnValue(true);

    await expect(sitemap()).resolves.toEqual([
      { url: "https://shrutiturner.co.uk/" },
      { url: "https://shrutiturner.co.uk/privacy" },
    ]);
  });

  it("disallows admin, app, API, instructor, and email surfaces in robots.txt", () => {
    const disallow = flattenDisallow(robots().rules);

    expect(disallow).toEqual(
      expect.arrayContaining(["/admin", "/dashboard", "/api", "/instructor", "/email"])
    );
    expect(disallow).not.toContain("/unsubscribe");
  });
});
