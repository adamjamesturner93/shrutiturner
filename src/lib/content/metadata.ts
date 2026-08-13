import type { Metadata } from "next";
import { getGlobalContent, getPageSeo } from "@/lib/content/public-content";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { getRuntimePlatformSettings } from "@/lib/platform/runtime-settings";

const DEFAULT_SEO_KEYWORDS = [
  "personal training",
  "movement coaching",
  "strength training",
  "rehabilitation",
  "fitness",
  "wellbeing",
];

const PAGE_PATHS: Record<string, string> = {
  home: "/",
  classes: "/classes",
  "classes-yoga": "/classes#yoga",
  "classes-strength": "/classes#strength",
  "classes-small-groups": "/classes/small-groups",
  pt: "/coaching",
  coaching: "/coaching",
  "coaching-enquire": "/coaching/enquire",
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
  absoluteTitle?: boolean;
  description?: string | null;
  path?: string;
  canonicalUrl?: string | null;
  keywords?: string | string[] | null;
  image?: string | null;
  imageAlt?: string | null;
  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
  follow?: boolean;
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
  const image = input.image || "https://shrutiturner.co.uk/social/active";
  const openGraphTitle = input.openGraphTitle || input.title;
  const openGraphDescription = input.openGraphDescription || description;
  const twitterTitle = input.twitterTitle || openGraphTitle;
  const twitterDescription = input.twitterDescription || openGraphDescription;

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description,
    keywords: resolveKeywords(input.keywords),
    alternates: {
      canonical,
    },
    robots: input.noIndex
      ? { index: false, follow: input.follow ?? false }
      : { index: true, follow: true },
    openGraph: {
      type: input.type || "website",
      siteName,
      title: openGraphTitle,
      description: openGraphDescription,
      url: canonical,
      images: [{ url: image, alt: input.imageAlt || input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
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
  const pageTitle = input.title.replace(/\s*(?:-|\|)\s*Shruti Turner$/i, "").trim();
  return buildSeoMetadata({
    title: `${pageTitle} | Shruti Turner`,
    absoluteTitle: true,
    description: input.description,
    path: input.path || `/${input.slug}`,
    canonicalUrl: `https://shrutiturner.co.uk${input.path || `/${input.slug}`}`,
    noIndex: true,
    follow: true,
    keywords: ["website terms", "privacy", "coaching policy", "online fitness policy"],
  });
}
