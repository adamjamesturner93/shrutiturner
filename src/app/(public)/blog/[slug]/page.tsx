import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostPage } from "@/views/blog-post";
import { getBlogPostBySlug, getBlogPostStaticParams, getBlogPosts } from "@/lib/content";

export async function generateStaticParams() {
  return getBlogPostStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, posts] = await Promise.all([getBlogPostBySlug(slug), getBlogPosts()]);
  if (!post) notFound();

  return <BlogPostPage post={post} posts={posts} />;
}
