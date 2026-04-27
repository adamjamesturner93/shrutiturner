import type { AuthorProfileContent, BlogPostContent } from "@/lib/content/types";

export type BlogPostContextualCta = {
  title: string;
  body: string;
  href: string;
  label: string;
};

export function getPostAuthors(post: BlogPostContent): AuthorProfileContent[] {
  if (post.authors.length > 0) return post.authors;
  if (post.author) {
    return [
      {
        id: post.author,
        slug: post.author.toLowerCase().replace(/\s+/g, "-"),
        name: post.author,
        bio: "",
      },
    ];
  }
  return [];
}

export function getAuthorLabel(post: BlogPostContent) {
  const authors = getPostAuthors(post);
  if (authors.length === 0) return "Shruti Turner";
  if (authors.length === 1) return authors[0]?.name || "Shruti Turner";
  return `${authors[0]?.name || "Shruti Turner"} + ${authors.length - 1}`;
}

export function formatAuthorList(post: BlogPostContent) {
  const authors = getPostAuthors(post).map((author) => author.name);
  if (authors.length <= 1) return authors[0] || "Shruti Turner";
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors.slice(0, -1).join(", ")}, and ${authors[authors.length - 1]}`;
}

export function getRelatedPosts(post: BlogPostContent, posts: BlogPostContent[]) {
  return posts
    .filter(
      (candidate) =>
        candidate.id !== post.id && candidate.tags.some((tag) => post.tags.includes(tag))
    )
    .slice(0, 3);
}

export function getBlogPostContextualCta(post: BlogPostContent): BlogPostContextualCta {
  const topic = `${post.title} ${post.tags.join(" ")}`.toLowerCase();

  if (topic.includes("yoga") || topic.includes("adaptive")) {
    return {
      title: "Practise with support",
      body: "Join live online classes built for complex bodies, with options that respect fluctuating symptoms.",
      href: "/classes",
      label: "View classes",
    };
  }

  if (
    topic.includes("strength") ||
    topic.includes("training") ||
    topic.includes("programming") ||
    topic.includes("hypermobility")
  ) {
    return {
      title: "Want help applying this?",
      body: "Get coaching that adapts strength work around pain, fatigue, flares, and real-life capacity.",
      href: "/coaching",
      label: "Explore coaching",
    };
  }

  return {
    title: "Build a steadier movement practice",
    body: "Explore coaching, classes, and resources designed for bodies that do not fit generic plans.",
    href: "/contact",
    label: "Ask a question",
  };
}
