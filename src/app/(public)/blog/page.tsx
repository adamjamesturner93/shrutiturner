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
            description: "Articles on strength, yoga, chronic illness, and complex bodies.",
          }),
          createBlogSchema({ posts }),
        ]}
      />
      <BlogPage posts={posts} />
    </>
  );
}
