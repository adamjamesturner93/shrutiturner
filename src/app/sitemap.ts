import type { MetadataRoute } from "next";
import { getBaseSiteUrl } from "@/lib/app-url";
import { getBlogPosts } from "@/lib/content";
import { listOperationalRetreats } from "@/lib/retreats/service";
import { HOLDING_SITEMAP_PATHS, isHoldingStage } from "@/lib/site-stage";

const STATIC_ROUTES = [
  "",
  "/blog",
  "/coaching",
  "/coaching/apply",
  "/contact",
  "/acceptable-use",
  "/coaching-agreement",
  "/cookies",
  "/health-declaration",
  "/privacy",
  "/refund-policy",
  "/retreats",
  "/terms",
] as const;

function toAbsoluteUrl(path: string) {
  return `${getBaseSiteUrl()}${path}`;
}

function dedupeEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isHoldingStage()) {
    return HOLDING_SITEMAP_PATHS.map((path) => ({
      url: toAbsoluteUrl(path),
    }));
  }

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: toAbsoluteUrl(path),
  }));

  const [postsResult, retreatsResult] = await Promise.allSettled([
    getBlogPosts(),
    listOperationalRetreats(),
  ]);

  const postEntries: MetadataRoute.Sitemap =
    postsResult.status === "fulfilled"
      ? postsResult.value.map((post) => ({
          url: toAbsoluteUrl(`/blog/${post.id}`),
          lastModified: post.date ? new Date(post.date) : undefined,
        }))
      : [];

  const retreatEntries: MetadataRoute.Sitemap =
    retreatsResult.status === "fulfilled"
      ? retreatsResult.value.map((retreat) => ({
          url: toAbsoluteUrl(`/retreats/${retreat.slug}`),
          lastModified: retreat.dates[0]?.startDate
            ? new Date(retreat.dates[0].startDate)
            : undefined,
        }))
      : [];

  return dedupeEntries([...staticEntries, ...postEntries, ...retreatEntries]);
}
