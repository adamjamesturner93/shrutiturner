import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEntries: vi.fn(),
  getEntryById: vi.fn(),
  getEntryBySlug: vi.fn(),
}));

vi.mock("@/lib/content/contentful-client", () => ({
  getEntries: mocks.getEntries,
  getEntryById: mocks.getEntryById,
  getEntryBySlug: mocks.getEntryBySlug,
}));

const { getBlogPostBySlug, getBlogPostPreviewBySlug, getBlogPosts } =
  await import("@/lib/content/public-content");

const richTextDocument = {
  nodeType: "document",
  content: [
    {
      nodeType: "paragraph",
      content: [
        { nodeType: "text", value: "Intro " },
        { nodeType: "text", value: "paragraph", marks: [{ type: "bold" }] },
        { nodeType: "text", value: "." },
      ],
    },
    {
      nodeType: "heading-2",
      content: [{ nodeType: "text", value: "Main idea" }],
    },
    {
      nodeType: "unordered-list",
      content: [
        {
          nodeType: "list-item",
          content: [
            {
              nodeType: "paragraph",
              content: [{ nodeType: "text", value: "First point" }],
            },
          ],
        },
      ],
    },
  ],
};

const blogPostResponse = {
  items: [
    {
      sys: { id: "entry_blog", publishedAt: "2026-04-01T09:30:00.000Z" },
      fields: {
        slug: "contentful-post",
        title: "Contentful Post",
        excerpt: "Post excerpt",
        content: richTextDocument,
        authors: [{ sys: { id: "author_1" } }],
        tags: ["Strength Training"],
        readTime: "4 min read",
        coverImageAsset: { sys: { id: "asset_1" } },
      },
    },
  ],
  includes: {
    Entry: [
      {
        sys: { id: "author_1" },
        fields: {
          name: "Guest Author",
          slug: "guest-author",
          bio: "Guest bio",
          active: true,
        },
      },
    ],
    Asset: [
      {
        sys: { id: "asset_1" },
        fields: {
          title: "Strength class image",
          description: "Coach demonstrating a movement",
          file: { url: "//images.ctfassets.net/space/image.jpg" },
        },
      },
    ],
  },
};

describe("Contentful public content mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEntries.mockResolvedValue(blogPostResponse);
  });

  it("maps Contentful blog rich text, linked authors and optimised asset images", async () => {
    const posts = await getBlogPosts();

    expect(posts[0]).toMatchObject({
      id: "contentful-post",
      title: "Contentful Post",
      content: expect.stringContaining("## Main idea"),
      date: "2026-04-01T09:30:00.000Z",
      author: "Guest Author",
      coverImage: "https://images.ctfassets.net/space/image.jpg?w=1200&fm=webp&q=80",
      coverAlt: "Coach demonstrating a movement",
      authors: [expect.objectContaining({ name: "Guest Author" })],
    });
    expect(posts[0]?.content).toContain("- First point");
    expect(posts[0]?.content).toContain("Intro **paragraph**.");
  });

  it("loads draft blog previews from the Contentful preview API", async () => {
    const preview = await getBlogPostPreviewBySlug("contentful-post");

    expect(preview?.id).toBe("contentful-post");
    expect(mocks.getEntries).toHaveBeenCalledWith(
      "blogPost",
      {
        "fields.slug": "contentful-post",
        limit: 1,
        include: 2,
      },
      { preview: true }
    );
  });

  it("loads published blog posts by slug without fetching the whole listing", async () => {
    const post = await getBlogPostBySlug("contentful-post");

    expect(post?.id).toBe("contentful-post");
    expect(mocks.getEntries).toHaveBeenCalledWith("blogPost", {
      "fields.slug": "contentful-post",
      limit: 1,
      include: 2,
    });
  });

  it("returns null when a published blog slug is missing", async () => {
    mocks.getEntries.mockResolvedValueOnce({ items: [] });

    await expect(getBlogPostBySlug("missing-post")).resolves.toBeNull();
  });

  it("throws instead of falling back when Contentful has no published blog posts", async () => {
    mocks.getEntries.mockResolvedValueOnce({ items: [] });

    await expect(getBlogPosts()).rejects.toThrow(
      "CONTENTFUL_CONTENT_MISSING: blogPost returned no published entries"
    );
  });
});
