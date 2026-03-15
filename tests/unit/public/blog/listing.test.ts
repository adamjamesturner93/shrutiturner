import { describe, expect, it } from "vitest";
import { blogPosts } from "@/data/blog-data";
import { filterAndSortPosts, resolveSelectedTag } from "@/lib/blog/listing";

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
    expect(posts[0]?.date >= posts[1]?.date!).toBe(true);
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
});
