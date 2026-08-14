import type { BlogPostContent } from "@/lib/content/types";

export type BlogPillar = "rehabilitation" | "fitness" | "wellbeing";

const BLOG_PILLAR_BY_SLUG: Record<string, BlogPillar> = {
  "strength-training-chronic-illness": "fitness",
  "programming-around-flares": "fitness",
  "hypermobility-strength-training": "rehabilitation",
  "building-training-capacity": "fitness",
  "choose-yoga-strength-or-coaching": "fitness",
  "why-rest-weeks-belong-in-strength-programmes": "fitness",
};

const REHABILITATION_TAGS = new Set([
  "arthritis",
  "chronic pain",
  "clinical reasoning",
  "flares",
  "hypermobility",
  "joint health",
  "pain",
  "physiotherapy",
  "rehabilitation",
]);

const WELLBEING_TAGS = new Set(["breathwork", "wellbeing", "yoga"]);

export function resolveBlogPillar(post: BlogPostContent): BlogPillar {
  if (post.category) return post.category;

  const explicitPillar = BLOG_PILLAR_BY_SLUG[post.id];
  if (explicitPillar) return explicitPillar;

  const tags = new Set(post.tags.map((tag) => tag.toLowerCase()));
  if ([...REHABILITATION_TAGS].some((tag) => tags.has(tag))) return "rehabilitation";
  if ([...WELLBEING_TAGS].some((tag) => tags.has(tag))) return "wellbeing";
  return "fitness";
}

export function resolveSelectedPillar(value: string | null): BlogPillar | "all" {
  return value === "rehabilitation" || value === "fitness" || value === "wellbeing" ? value : "all";
}

export function resolveSelectedTag(tagParam: string | null, allTags: string[]) {
  if (!tagParam) return "all";
  const matched = allTags.find((tag) => tag.toLowerCase() === tagParam.toLowerCase());
  return matched || "all";
}

export function filterAndSortPosts(
  posts: BlogPostContent[],
  selectedTag: string,
  sortBy: "newest" | "oldest" | "a-z",
  searchQuery = "",
  selectedPillar: BlogPillar | "all" = "all"
) {
  let filtered = [...posts];

  if (selectedPillar !== "all") {
    filtered = filtered.filter((post) => resolveBlogPillar(post) === selectedPillar);
  }

  if (selectedTag !== "all") {
    const selectedTagLower = selectedTag.toLowerCase();
    filtered = filtered.filter((post) =>
      post.tags.some((tag) => tag.toLowerCase() === selectedTagLower)
    );
  }

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((post) => {
      const haystack = [
        post.title,
        post.excerpt,
        post.content,
        resolveBlogPillar(post),
        ...post.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  if (sortBy === "newest") {
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } else if (sortBy === "oldest") {
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  return filtered;
}

export function paginatePosts(posts: BlogPostContent[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    currentPage,
    totalPages,
    items: posts.slice(start, start + pageSize),
  };
}
