import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { BlogPage } from "@/views/blog";
import { buildSeoMetadata } from "@/lib/content/metadata";
import { getBlogPosts } from "@/lib/content";
import { createBlogSchema, createWebPageSchema } from "@/lib/seo/structured-data";

const BLOG_SOCIAL_IMAGE = "https://shrutiturner.co.uk/social/blog";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Movement, Strength & Rehabilitation Blog | Shruti Turner",
    absoluteTitle: true,
    description:
      "Evidence-informed articles about movement, strength, pain, recovery and wellbeing, translating research into practical choices for real bodies and real life.",
    canonicalUrl: "https://shrutiturner.co.uk/blog",
    openGraphTitle: "Movement & Strength Resources | Shruti Turner",
    openGraphDescription:
      "Clear, evidence-informed writing about movement, rehabilitation, strength and wellbeing without unnecessary jargon.",
    image: BLOG_SOCIAL_IMAGE,
    imageAlt: "Shruti Turner strength training",
    keywords: [
      "movement blog",
      "strength training",
      "rehabilitation",
      "pain and recovery",
      "wellbeing",
    ],
  });
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
            description:
              "Evidence-informed articles about movement, strength, rehabilitation, recovery and wellbeing.",
          }),
          createBlogSchema({ posts }),
        ]}
      />
      <BlogPage posts={posts} />
    </>
  );
}
