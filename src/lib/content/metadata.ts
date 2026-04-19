import type { Metadata } from "next";
import { getGlobalContent, getPageSeo } from "@/lib/content/public-content";
import { getRuntimePlatformSettings } from "@/lib/platform/runtime-settings";

export async function buildPageMetadata(slug: string, fallbackTitle: string): Promise<Metadata> {
  "use cache";

  const [seo, global, platformSettings] = await Promise.all([
    getPageSeo(slug),
    getGlobalContent(),
    getRuntimePlatformSettings(),
  ]);
  const title = seo?.title || fallbackTitle;
  const description =
    seo?.description || platformSettings.defaultSeoDescription || global.defaultSeoDescription;

  return {
    title,
    description,
    keywords: seo?.keywords,
    alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
  };
}
