import type { Metadata } from "next";
import { BlogPostPage } from "@/views/blog-post";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getBlogPostBySlug(id);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, posts] = await Promise.all([getBlogPostBySlug(id), getBlogPosts()]);
  return <BlogPostPage post={post} posts={posts} />;
}
