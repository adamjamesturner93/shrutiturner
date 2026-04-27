import { describe, expect, it } from "vitest";
import { blogPosts } from "@/data/blog-data";
import { filterAndSortPosts, paginatePosts, resolveSelectedTag } from "@/lib/blog/listing";

describe("blog listing helpers", () => {
  const allTags = Array.from(new Set(blogPosts.flatMap((post) => post.tags))).sort();

  it("resolves a valid tag case-insensitively", () => {
    expect(resolveSelectedTag("yoga", allTags)).toBe("Yoga");
  });

  it("falls back to all for an invalid tag", () => {
    expect(resolveSelectedTag("missing-tag", allTags)).toBe("all");
  });

  it("sorts posts newest first", () => {
    const posts = filterAndSortPosts(blogPosts, "all", "newest");
    expect(posts).toHaveLength(blogPosts.length);
    expect(new Date(posts[0].date).getTime()).toBeGreaterThanOrEqual(
      new Date(posts[1].date).getTime()
    );
  });

  it("sorts posts alphabetically", () => {
    const posts = filterAndSortPosts(blogPosts, "all", "a-z");
    expect(posts[0]?.title).toBe("Building Training Capacity When You Start From Zero");
  });

  it("filters posts by tag before sorting", () => {
    const posts = filterAndSortPosts(blogPosts, "Yoga", "newest");
    expect(posts).toHaveLength(1);
    expect(posts[0]?.id).toBe("adaptive-yoga-vs-mainstream");
  });

  it("searches posts by title, excerpt, content, or tag", () => {
    const posts = filterAndSortPosts(blogPosts, "all", "newest", "hypermobility");
    expect(posts.length).toBeGreaterThan(0);
    expect(
      posts.every((post) =>
        [post.title, post.excerpt, post.content, ...post.tags]
          .join(" ")
          .toLowerCase()
          .includes("hypermobility")
      )
    ).toBe(true);
  });

  it("paginates posts with a bounded current page", () => {
    const result = paginatePosts(blogPosts, 99, 2);
    expect(result.currentPage).toBe(result.totalPages);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.length).toBeLessThanOrEqual(2);
  });
});
