import type { Metadata } from "next";
import { getGlobalContent, getPageSeo } from "@/lib/content/public-content";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { getRuntimePlatformSettings } from "@/lib/platform/runtime-settings";

const DEFAULT_SEO_KEYWORDS = [
  "strength training chronic illness",
  "adaptive yoga",
  "inclusive movement coaching",
  "chronic pain exercise",
  "hypermobility strength",
  "rehabilitation informed training",
];

const PAGE_PATHS: Record<string, string> = {
  home: "/",
  classes: "/classes",
  "classes-yoga": "/classes#yoga",
  "classes-strength": "/classes#strength",
  "classes-small-groups": "/classes/small-groups",
  pt: "/coaching",
  coaching: "/coaching",
  "coaching-apply": "/coaching/apply",
  "coaching-personal-programme": "/coaching/personal-programme",
  pricing: "/pricing",
  terms: "/terms",
  privacy: "/privacy",
  cookies: "/cookies",
  "health-declaration": "/health-declaration",
  "refund-policy": "/refund-policy",
  "acceptable-use": "/acceptable-use",
  "coaching-agreement": "/coaching-agreement",
  about: "/about",
  contact: "/contact",
  schedule: "/schedule",
  retreats: "/retreats",
  blog: "/blog",
};

type BuildSeoMetadataInput = {
  title: string;
  description?: string | null;
  path?: string;
  canonicalUrl?: string | null;
  keywords?: string | string[] | null;
  image?: string | null;
  imageAlt?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
};

function resolveKeywords(keywords?: string | string[] | null) {
  if (Array.isArray(keywords)) return keywords;
  if (typeof keywords === "string" && keywords.trim()) {
    return keywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }
  return DEFAULT_SEO_KEYWORDS;
}

function resolveCanonical(input: Pick<BuildSeoMetadataInput, "canonicalUrl" | "path">) {
  if (input.canonicalUrl) return input.canonicalUrl;
  return buildAbsoluteUrl(input.path || "/");
}

export async function buildSeoMetadata(input: BuildSeoMetadataInput): Promise<Metadata> {
  "use cache";

  const [global, platformSettings] = await Promise.all([
    getGlobalContent(),
    getRuntimePlatformSettings(),
  ]);
  const description =
    input.description || platformSettings.defaultSeoDescription || global.defaultSeoDescription;
  const canonical = resolveCanonical(input);
  const siteName = platformSettings.businessName || global.siteName;
  const image = input.image || "/og-image.jpg";

  return {
    title: input.title,
    description,
    keywords: resolveKeywords(input.keywords),
    alternates: {
      canonical,
    },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: input.type || "website",
      siteName,
      title: input.title,
      description,
      url: canonical,
      images: [{ url: image, alt: input.imageAlt || input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [image],
    },
  };
}

export async function buildPageMetadata(slug: string, fallbackTitle: string): Promise<Metadata> {
  "use cache";

  const seo = await getPageSeo(slug);
  const title = seo?.title || fallbackTitle;

  return buildSeoMetadata({
    title,
    description: seo?.description,
    keywords: seo?.keywords,
    canonicalUrl: seo?.canonicalUrl,
    path: PAGE_PATHS[slug] || `/${slug}`,
  });
}

export async function buildLegalDocumentMetadata(input: {
  slug: string;
  title: string;
  description?: string | null;
  path?: string;
  noIndex?: boolean;
}): Promise<Metadata> {
  return buildSeoMetadata({
    title: input.title,
    description: input.description,
    path: input.path || `/${input.slug}`,
    noIndex: input.noIndex,
    keywords: ["website terms", "privacy", "coaching policy", "online fitness policy"],
  });
}
