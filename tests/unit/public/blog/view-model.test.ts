import { describe, expect, it } from "vitest";
import { blogAuthors, blogPosts } from "@/data/blog-data";
import {
  formatAuthorList,
  getBlogPostContextualCta,
  getAuthorLabel,
  getPostAuthors,
  getRelatedPosts,
} from "@/lib/blog/view-model";

describe("blog view model helpers", () => {
  it("returns existing author objects when present", () => {
    const authors = getPostAuthors(blogPosts[0]!);
    expect(authors).toEqual(blogPosts[0]!.authors);
  });

  it("falls back to a single derived author when only author text exists", () => {
    const post = {
      ...blogPosts[0]!,
      authors: [],
      author: "Guest Name",
    };

    expect(getPostAuthors(post)).toEqual([
      {
        id: "Guest Name",
        slug: "guest-name",
        name: "Guest Name",
        bio: "",
      },
    ]);
  });

  it("builds compact list labels for multi-author cards", () => {
    const multiAuthorPost = {
      ...blogPosts[0]!,
      authors: [blogAuthors[0]!, blogAuthors[1]!],
    };

    expect(getAuthorLabel(multiAuthorPost)).toBe("Shruti Turner + 1");
  });

  it("formats author bylines for article pages", () => {
    expect(formatAuthorList(blogPosts[0]!)).toBe("Shruti Turner");

    const post = {
      ...blogPosts[0]!,
      authors: [blogAuthors[0]!, blogAuthors[1]!],
    };
    expect(formatAuthorList(post)).toBe("Shruti Turner and Dr Hannah Lewis");
  });

  it("finds related posts by shared tags and excludes the current post", () => {
    const related = getRelatedPosts(blogPosts[0]!, blogPosts);
    expect(related).toHaveLength(3);
    expect(related.map((post) => post.id)).not.toContain(blogPosts[0]!.id);
    expect(related.every((post) => post.tags.some((tag) => blogPosts[0]!.tags.includes(tag)))).toBe(
      true
    );
  });

  it("selects contextual article CTAs from post topics", () => {
    expect(getBlogPostContextualCta(blogPosts[0]!).href).toBe("/coaching");
    expect(getBlogPostContextualCta(blogPosts[1]!).href).toBe("/classes");
  });
});
