import type { MetadataRoute } from "next";
import { getBaseSiteUrl } from "@/lib/app-url";
import { getBlogPosts, getClassDefinitions, getRetreatsCombined } from "@/lib/content";
import { HOLDING_SITEMAP_PATHS, isHoldingStage } from "@/lib/site-stage";

const STATIC_ROUTES = [
  "",
  "/about",
  "/blog",
  "/classes",
  "/classes/strength",
  "/classes/yoga",
  "/coaching",
  "/coaching/apply",
  "/coaching/personal-programme",
  "/contact",
  "/pricing",
  "/pt",
  "/retreats",
  "/schedule",
  "/acceptable-use",
  "/coaching-agreement",
  "/cookies",
  "/health-declaration",
  "/privacy",
  "/refund-policy",
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

  const [postsResult, classesResult, retreatsResult] = await Promise.allSettled([
    getBlogPosts(),
    getClassDefinitions(),
    getRetreatsCombined(),
  ]);

  const postEntries: MetadataRoute.Sitemap =
    postsResult.status === "fulfilled"
      ? postsResult.value.map((post) => ({
          url: toAbsoluteUrl(`/blog/${post.id}`),
          lastModified: post.date ? new Date(post.date) : undefined,
        }))
      : [];

  const classEntries: MetadataRoute.Sitemap =
    classesResult.status === "fulfilled"
      ? classesResult.value.map((cls) => ({
          url: toAbsoluteUrl(`/classes/${cls.slug}`),
        }))
      : [];

  const retreatEntries: MetadataRoute.Sitemap =
    retreatsResult.status === "fulfilled"
      ? retreatsResult.value.map((retreat) => ({
          url: toAbsoluteUrl(`/retreats/${retreat.slug}`),
        }))
      : [];

  return dedupeEntries([...staticEntries, ...postEntries, ...classEntries, ...retreatEntries]);
}
