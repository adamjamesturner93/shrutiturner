import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostPage } from "@/views/blog-post";
import { formatAuthorList } from "@/lib/blog/view-model";
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

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const canonical = `https://shrutiturner.co.uk/blog/${post.id}`;

  return {
    title,
    description,
    keywords: post.tags,
    alternates: {
      canonical,
    },
    authors: [{ name: formatAuthorList(post) }],
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      publishedTime: post.date,
      authors: [formatAuthorList(post)],
      tags: post.tags,
      images: [{ url: post.coverImage, alt: post.coverAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [post.coverImage],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, posts] = await Promise.all([getBlogPostBySlug(slug), getBlogPosts()]);
  if (!post) notFound();

  return <BlogPostPage post={post} posts={posts} />;
}
