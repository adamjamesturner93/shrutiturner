import { describe, expect, it } from "vitest";
import { buildBlogShareLinks } from "@/lib/blog/share-links";

describe("buildBlogShareLinks", () => {
  it("builds all expected social and email share URLs", () => {
    const links = buildBlogShareLinks({
      url: "https://shrutiturner.co.uk/blog/test-post",
      title: "A Useful Post",
      excerpt: "Helpful summary",
    });

    expect(links.x).toBe(
      "https://x.com/intent/tweet?url=https%3A%2F%2Fshrutiturner.co.uk%2Fblog%2Ftest-post&text=A%20Useful%20Post"
    );
    expect(links.facebook).toBe(
      "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fshrutiturner.co.uk%2Fblog%2Ftest-post"
    );
    expect(links.linkedin).toBe(
      "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fshrutiturner.co.uk%2Fblog%2Ftest-post"
    );
    expect(links.whatsapp).toBe(
      "https://wa.me/?text=A%20Useful%20Post%20https%3A%2F%2Fshrutiturner.co.uk%2Fblog%2Ftest-post"
    );
    expect(links.email).toBe(
      "mailto:?subject=A%20Useful%20Post&body=Helpful%20summary%0A%0Ahttps%3A%2F%2Fshrutiturner.co.uk%2Fblog%2Ftest-post"
    );
  });

  it("handles a missing excerpt", () => {
    const links = buildBlogShareLinks({
      url: "https://shrutiturner.co.uk/blog/test-post",
      title: "No Excerpt",
    });

    expect(links.email).toContain("body=%0A%0Ahttps%3A%2F%2Fshrutiturner.co.uk%2Fblog%2Ftest-post");
  });
});
