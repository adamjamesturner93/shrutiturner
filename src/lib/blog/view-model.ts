import type { AuthorProfileContent, BlogPostContent } from "@/lib/content/types";

export type BlogPostContextualCta = {
  title: string;
  body: string;
  href: string;
  label: string;
};

export const SHRUTI_AUTHOR_ROLE = "Movement & Fitness Coach";
export const SHRUTI_AUTHOR_BIO =
  "Shruti brings together biomechanics research, rehabilitation expertise, personal training, strength and conditioning, yoga and lived experience to help people build movement and training around their body, goals and real life.";

function canonicalizeAuthor(author: AuthorProfileContent): AuthorProfileContent {
  if (author.slug !== "shruti-turner" && author.name !== "Shruti Turner") return author;
  return {
    ...author,
    slug: "shruti-turner",
    name: "Shruti Turner",
    role: SHRUTI_AUTHOR_ROLE,
    bio: SHRUTI_AUTHOR_BIO,
    avatarImageUrl: "/images/shruti.jpeg",
    avatarAlt: "Shruti Turner",
    websiteUrl: "/about",
    isGuestContributor: false,
  };
}

export function getPostAuthors(post: BlogPostContent): AuthorProfileContent[] {
  if (post.authors.length > 0) return post.authors.map(canonicalizeAuthor);
  if (post.author) {
    return [
      {
        id: post.author,
        slug: post.author.toLowerCase().replace(/\s+/g, "-"),
        name: post.author,
        bio: "",
      },
    ].map(canonicalizeAuthor);
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
  return `${authors.slice(0, -1).join(", ")} and ${authors[authors.length - 1]}`;
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

  if (
    topic.includes("strength") ||
    topic.includes("training") ||
    topic.includes("programming") ||
    topic.includes("hypermobility")
  ) {
    return {
      title: "Want help applying this?",
      body: "Get personal coaching that adapts strength and movement around your body, goals and real-life capacity.",
      href: "/coaching",
      label: "Explore coaching",
    };
  }

  return {
    title: "Build movement around real life",
    body: "Explore personal coaching that brings together rehabilitation, fitness and wellbeing with support shaped around what you need.",
    href: "/coaching",
    label: "Explore coaching",
  };
}
