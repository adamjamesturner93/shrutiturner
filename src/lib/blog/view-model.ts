import type { AuthorProfileContent, BlogPostContent } from "@/lib/content/types";

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
