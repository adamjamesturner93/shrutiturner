import type { BlogPostContent } from "@/lib/content";

export function resolveSelectedTag(tagParam: string | null, allTags: string[]) {
  if (!tagParam) return "all";
  const matched = allTags.find((tag) => tag.toLowerCase() === tagParam.toLowerCase());
  return matched || "all";
}

export function filterAndSortPosts(
  posts: BlogPostContent[],
  selectedTag: string,
  sortBy: "newest" | "oldest" | "a-z"
) {
  let filtered = [...posts];

  if (selectedTag !== "all") {
    filtered = filtered.filter((post) => post.tags.includes(selectedTag));
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
