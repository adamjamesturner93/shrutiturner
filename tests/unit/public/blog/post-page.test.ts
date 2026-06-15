import { beforeEach, describe, expect, it, vi } from "vitest";

const notFoundMock = vi.fn();
const getBlogPostBySlugMock = vi.fn();
const getBlogPostStaticParamsMock = vi.fn();
const getBlogPostsMock = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/lib/content", () => ({
  getBlogPostBySlug: getBlogPostBySlugMock,
  getBlogPostStaticParams: getBlogPostStaticParamsMock,
  getBlogPosts: getBlogPostsMock,
}));

vi.mock("@/views/blog-post", () => ({
  BlogPostPage: ({ post }: { post: { title: string } }) => post.title,
}));

const page = await import("@/app/(public)/blog/[slug]/page");

describe("/blog/[slug] page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notFoundMock.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
    getBlogPostsMock.mockResolvedValue([]);
    getBlogPostStaticParamsMock.mockResolvedValue([{ slug: "known-post" }]);
  });

  it("exposes static params for published blog posts", async () => {
    await expect(page.generateStaticParams()).resolves.toEqual([{ slug: "known-post" }]);
    expect(getBlogPostStaticParamsMock).toHaveBeenCalledTimes(1);
  });

  it("calls notFound for unknown slugs", async () => {
    getBlogPostBySlugMock.mockResolvedValue(null);

    await expect(
      page.default({
        params: Promise.resolve({ slug: "missing-post" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("renders the blog post view for known slugs", async () => {
    getBlogPostBySlugMock.mockResolvedValue({
      id: "strength-training-chronic-illness",
      title: "Known post",
      excerpt: "",
      content: "",
      authors: [],
      date: "2026-02-15",
      tags: [],
      readTime: "5 min read",
      coverImage: "",
      coverAlt: "",
    });

    const result = await page.default({
      params: Promise.resolve({ slug: "strength-training-chronic-illness" }),
    });

    expect(notFoundMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      props: {
        post: expect.objectContaining({
          id: "strength-training-chronic-illness",
          title: "Known post",
        }),
      },
    });
  });
});
