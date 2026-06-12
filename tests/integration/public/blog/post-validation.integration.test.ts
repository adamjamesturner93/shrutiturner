import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/content", () => ({
  getBlogPostBySlug: (slug: string) =>
    Promise.resolve(slug === "strength-training-chronic-illness" ? { id: slug } : null),
}));

const { isKnownBlogPostSlug } = await import("@/lib/blog/post-validation");

describe("blog post validation integration", () => {
  it("recognizes known local blog post slugs", async () => {
    await expect(isKnownBlogPostSlug("strength-training-chronic-illness")).resolves.toBe(true);
  });

  it("rejects unknown blog post slugs", async () => {
    await expect(isKnownBlogPostSlug("missing-post-slug")).resolves.toBe(false);
  });
});
