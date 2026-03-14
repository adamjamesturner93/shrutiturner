import type { Metadata } from "next";
import { getGlobalContent, getPageSeo } from "@/lib/content/public-content";

export async function buildPageMetadata(slug: string, fallbackTitle: string): Promise<Metadata> {
  "use cache";

  const [seo, global] = await Promise.all([getPageSeo(slug), getGlobalContent()]);
  const title = seo?.title || fallbackTitle;
  const description = seo?.description || global.defaultSeoDescription;

  return {
    title,
    description,
    keywords: seo?.keywords,
    alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
  };
}
