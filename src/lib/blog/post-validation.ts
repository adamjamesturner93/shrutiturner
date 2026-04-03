import { getBlogPostBySlug } from "@/lib/content";

export async function isKnownBlogPostSlug(slug: string) {
  const post = await getBlogPostBySlug(slug);
  return Boolean(post);
}
