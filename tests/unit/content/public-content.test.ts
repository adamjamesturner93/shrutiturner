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

const {
  getBlogPostBySlug,
  getBlogPostPreviewBySlug,
  getBlogPosts,
  getFeaturedTestimonials,
  getRetreatTemplates,
} = await import("@/lib/content/public-content");

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
        category: "fitness",
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
          avatarImageAsset: { sys: { id: "asset_author" } },
          active: true,
        },
      },
    ],
    Asset: [
      {
        sys: { id: "asset_author" },
        fields: {
          title: "Guest author portrait",
          description: "Guest author smiling",
          file: { url: "//images.ctfassets.net/space/author.jpg" },
        },
      },
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
      category: "fitness",
      coverImage: "https://images.ctfassets.net/space/image.jpg?w=1200&fm=webp&q=80",
      coverAlt: "Coach demonstrating a movement",
      authors: [
        expect.objectContaining({
          name: "Guest Author",
          avatarImageUrl: "https://images.ctfassets.net/space/author.jpg?w=256&fm=webp&q=80",
          avatarAlt: "Guest author smiling",
        }),
      ],
    });
    expect(posts[0]?.content).toContain("- First point");
    expect(posts[0]?.content).toContain("Intro **paragraph**.");
  });

  it("maps linked retreat schedule days from newline-separated activities", async () => {
    mocks.getEntries.mockResolvedValueOnce({
      items: [
        {
          sys: { id: "retreat_1" },
          fields: {
            slug: "structured-retreat",
            title: "Structured Retreat",
            subtitle: "A calmer way to plan",
            shortDescription: "Short description",
            fullDescription: "Full description",
            suitableFor: [],
            included: [],
            notIncluded: [],
            scheduleDays: [{ sys: { id: "day_1" } }],
          },
        },
      ],
      includes: {
        Entry: [
          {
            sys: { id: "day_1" },
            fields: {
              title: "Earth",
              subtitle: "Finding steady ground",
              activities: "Welcome circle\n\nGentle movement\nReflection",
            },
          },
        ],
      },
    });

    const templates = await getRetreatTemplates();

    expect(templates[0]?.schedule).toEqual([
      {
        day: "Day 1",
        title: "Earth",
        subtitle: "Finding steady ground",
        activities: ["Welcome circle", "Gentle movement", "Reflection"],
      },
    ]);
    expect(mocks.getEntries).toHaveBeenCalledWith("retreatTemplate", {
      limit: 200,
      include: 2,
    });
  });

  it("converts legacy HTML photo-credit links into safe Markdown", async () => {
    mocks.getEntries.mockResolvedValueOnce({
      ...blogPostResponse,
      items: [
        {
          ...blogPostResponse.items[0],
          fields: {
            ...blogPostResponse.items[0].fields,
            content:
              'Photo by <a href="https://unsplash.com/@author?utm_source=test&amp;utm_medium=referral">Photographer</a> on <a href="https://unsplash.com/photos/example">Unsplash</a>',
          },
        },
      ],
    });

    const posts = await getBlogPosts();

    expect(posts[0]?.content).toBe(
      "Photo by [Photographer](https://unsplash.com/@author?utm_source=test&utm_medium=referral) on [Unsplash](https://unsplash.com/photos/example)"
    );
    expect(posts[0]?.content).not.toContain("<a");
  });

  it("uses the bundled Shruti portrait when no Contentful author asset is linked", async () => {
    mocks.getEntries.mockResolvedValueOnce({
      ...blogPostResponse,
      includes: {
        ...blogPostResponse.includes,
        Entry: [
          {
            sys: { id: "author_1" },
            fields: {
              name: "Dr Shruti Turner",
              slug: "shruti-turner",
              bio: "Shruti bio",
              avatarImageUrl: "https://media.licdn.com/expired-profile-image",
              active: true,
            },
          },
        ],
      },
    });

    const posts = await getBlogPosts();

    expect(posts[0]?.authors?.[0]?.avatarImageUrl).toBe("/images/shruti.jpeg");
  });

  it("maps safe Contentful rich-text hyperlinks to Markdown", async () => {
    mocks.getEntries.mockResolvedValueOnce({
      ...blogPostResponse,
      items: [
        {
          ...blogPostResponse.items[0],
          fields: {
            ...blogPostResponse.items[0].fields,
            content: {
              nodeType: "document",
              content: [
                {
                  nodeType: "paragraph",
                  content: [
                    { nodeType: "text", value: "Read " },
                    {
                      nodeType: "hyperlink",
                      data: { uri: "https://example.com/article" },
                      content: [{ nodeType: "text", value: "the article" }],
                    },
                    { nodeType: "text", value: "." },
                  ],
                },
              ],
            },
          },
        },
      ],
    });

    const posts = await getBlogPosts();

    expect(posts[0]?.content).toBe("Read [the article](https://example.com/article).");
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

  it("loads homepage testimonials using only Contentful's featured flag", async () => {
    mocks.getEntries.mockResolvedValueOnce({
      items: [
        {
          sys: { id: "testimonial_meg" },
          fields: {
            quote: "Training now feels like it belongs to me.",
            authorName: "Meg K",
            featured: true,
          },
        },
      ],
    });

    await expect(getFeaturedTestimonials()).resolves.toEqual([
      {
        id: "testimonial_meg",
        quote: "Training now feels like it belongs to me.",
        authorName: "Meg K",
        featured: true,
      },
    ]);
    expect(mocks.getEntries).toHaveBeenCalledWith("testimonial", {
      "fields.featured": true,
      limit: 3,
    });
  });

  it("throws instead of falling back when Contentful has no published blog posts", async () => {
    mocks.getEntries.mockResolvedValueOnce({ items: [] });

    await expect(getBlogPosts()).rejects.toThrow(
      "CONTENTFUL_CONTENT_MISSING: blogPost returned no published entries"
    );
  });
});
