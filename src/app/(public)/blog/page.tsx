import type { Metadata } from "next";
import { BlogPage } from "@/views/blog";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getBlogPosts } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("blog", "Blog");
}

export default async function Page() {
  const posts = await getBlogPosts();
  return <BlogPage posts={posts} />;
}
