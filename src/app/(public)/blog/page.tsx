import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { BlogPage } from "@/views/blog";
import { buildPageMetadata } from "@/lib/content/metadata";
import { getBlogPosts } from "@/lib/content";
import { createBlogSchema, createWebPageSchema } from "@/lib/seo/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("blog", "Blog");
}

export default async function Page() {
  const posts = await getBlogPosts();
  return (
    <>
      <JsonLd
        data={[
          createWebPageSchema({
            name: "Blog",
            path: "/blog",
            type: "CollectionPage",
            description: "Science-backed articles about movement, healthy living, chronic conditions and preventing/recovering from injury.",
          }),
          createBlogSchema({ posts }),
        ]}
      />
      <BlogPage posts={posts} />
    </>
  );
}
