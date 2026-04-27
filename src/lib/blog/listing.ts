import type { BlogPostContent } from "@/lib/content/types";

export function resolveSelectedTag(tagParam: string | null, allTags: string[]) {
  if (!tagParam) return "all";
  const matched = allTags.find((tag) => tag.toLowerCase() === tagParam.toLowerCase());
  return matched || "all";
}

export function filterAndSortPosts(
  posts: BlogPostContent[],
  selectedTag: string,
  sortBy: "newest" | "oldest" | "a-z",
  searchQuery = ""
) {
  let filtered = [...posts];

  if (selectedTag !== "all") {
    filtered = filtered.filter((post) => post.tags.includes(selectedTag));
  }

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((post) => {
      const haystack = [post.title, post.excerpt, post.content, ...post.tags]
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
