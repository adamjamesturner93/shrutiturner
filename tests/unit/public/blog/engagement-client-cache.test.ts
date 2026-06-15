import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("blog engagement client cache policy", () => {
  it("loads comments and reactions dynamically instead of through ISR", async () => {
    const [commentsSource, reactionsSource] = await Promise.all([
      readFile("src/components/blog-comments.tsx", "utf8"),
      readFile("src/components/blog-reactions.tsx", "utf8"),
    ]);

    expect(commentsSource).toContain(
      'fetch(`/api/blog/${postId}/engagement`, { cache: "no-store" })'
    );
    expect(reactionsSource).toContain(
      'fetch(`/api/blog/${postId}/engagement`, { cache: "no-store" })'
    );
  });
});
