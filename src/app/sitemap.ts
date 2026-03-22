import type { MetadataRoute } from "next";
import { getBaseSiteUrl } from "@/lib/app-url";
import {
  getBlogPosts,
  getClassDefinitions,
  getRetreatsCombined,
  getSmallGroupTemplates,
} from "@/lib/content";

const STATIC_ROUTES = [
  "",
  "/about",
  "/blog",
  "/classes",
  "/classes/small-groups",
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
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: toAbsoluteUrl(path),
  }));

  const [postsResult, classesResult, smallGroupsResult, retreatsResult] = await Promise.allSettled([
    getBlogPosts(),
    getClassDefinitions(),
    getSmallGroupTemplates(),
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

  const smallGroupEntries: MetadataRoute.Sitemap =
    smallGroupsResult.status === "fulfilled"
      ? smallGroupsResult.value.map((programme) => ({
          url: toAbsoluteUrl(`/classes/small-groups/${programme.slug}`),
        }))
      : [];

  const retreatEntries: MetadataRoute.Sitemap =
    retreatsResult.status === "fulfilled"
      ? retreatsResult.value.map((retreat) => ({
          url: toAbsoluteUrl(`/retreats/${retreat.slug}`),
        }))
      : [];

  return dedupeEntries([
    ...staticEntries,
    ...postEntries,
    ...classEntries,
    ...smallGroupEntries,
    ...retreatEntries,
  ]);
}
