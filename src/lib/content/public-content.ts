import { getScheduleByDay } from "@/data/schedule-data";
import {
  LOCAL_BLOG_POSTS,
  LOCAL_CLASS_DEFINITIONS,
  LOCAL_GLOBAL_CONTENT,
  LOCAL_PAGE_CONTENT,
  LOCAL_RETREAT_INSTANCES,
  LOCAL_RETREATS_COMBINED,
  LOCAL_RETREAT_TEMPLATES,
  LOCAL_RETREAT_VENUES,
  getLocalScheduleByDay,
} from "./local-content";
import { getContentSource } from "./config";
import { getEntries, getEntryBySlug } from "./contentful-client";
import type {
  BlogPostContent,
  ClassDefinitionContent,
  GlobalContent,
  PageContent,
  RetreatCombinedContent,
  RetreatInstanceContent,
  RetreatTemplateContent,
  RetreatVenueContent,
  SeoContent,
} from "./types";

type ScheduleDay = ReturnType<typeof getScheduleByDay>[number];

function prefersContentfulSource() {
  const source = getContentSource();
  return source === "contentful" || source === "hybrid";
}

function allowsLocalFallback() {
  const source = getContentSource();
  return source === "local" || source === "hybrid";
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function combineRetreats(
  templates: RetreatTemplateContent[],
  instances: RetreatInstanceContent[],
  venues: RetreatVenueContent[]
): RetreatCombinedContent[] {
  const venueMap = new Map(venues.map((v) => [v.slug, v]));

  return templates
    .map((template) => {
      const templateInstances = instances.filter((i) => i.templateSlug === template.slug);
      if (templateInstances.length === 0) return null;

      const sorted = [...templateInstances].sort((a, b) => a.startDate.localeCompare(b.startDate));
      const first = sorted[0];
      const venue = template.venueSlug ? venueMap.get(template.venueSlug) : undefined;

      return {
        id: template.id,
        slug: template.slug,
        title: template.title,
        subtitle: template.subtitle,
        location: venue?.displayLocation || venue?.name || "TBC",
        imageUrl: "",
        shortDescription: template.shortDescription,
        fullDescription: template.fullDescription,
        dates: sorted.map((i) => ({
          id: i.id,
          startDate: i.startDate,
          endDate: i.endDate,
          availableSpaces: i.availableSpaces,
          totalSpaces: i.totalSpaces,
        })),
        earlyBirdPrice: first.earlyBirdPrice,
        earlyBirdDeadline: first.earlyBirdDeadline,
        normalPrice: first.normalPrice,
        currency: first.currency,
        included: template.included,
        notIncluded: template.notIncluded,
        schedule: [],
        accommodation: venue?.accommodationType || venue?.description || "",
        suitableFor: template.suitableFor,
      } satisfies RetreatCombinedContent;
    })
    .filter((item): item is RetreatCombinedContent => item !== null);
}

export async function getGlobalContent(): Promise<GlobalContent> {
  if (prefersContentfulSource()) {
    const entry = await getEntryBySlug<Record<string, unknown>>("globalContent", "global");
    if (entry) {
      return {
        siteName: String(entry.fields.siteName || LOCAL_GLOBAL_CONTENT.siteName),
        siteTagline: String(entry.fields.siteTagline || LOCAL_GLOBAL_CONTENT.siteTagline),
        defaultSeoDescription: String(
          entry.fields.defaultSeoDescription || LOCAL_GLOBAL_CONTENT.defaultSeoDescription
        ),
      };
    }
  }

  return LOCAL_GLOBAL_CONTENT;
}

export async function getPageContent(slug: string): Promise<PageContent | null> {
  if (prefersContentfulSource()) {
    const entry = await getEntryBySlug<Record<string, unknown>>("pageContent", slug);
    if (entry) {
      return {
        slug,
        seo: {
          title: String(entry.fields.seoTitle || entry.fields.title || slug),
          description: entry.fields.seoDescription
            ? String(entry.fields.seoDescription)
            : undefined,
          keywords: entry.fields.seoKeywords ? String(entry.fields.seoKeywords) : undefined,
          canonicalUrl: entry.fields.canonicalUrl
            ? String(entry.fields.canonicalUrl)
            : undefined,
        },
      };
    }
  }

  return LOCAL_PAGE_CONTENT[slug] || null;
}

export async function getPageSeo(slug: string): Promise<SeoContent | null> {
  const page = await getPageContent(slug);
  return page?.seo || null;
}

export async function getBlogPosts(): Promise<BlogPostContent[]> {
  if (prefersContentfulSource()) {
    const res = await getEntries<Record<string, unknown>>("blogPost", {
      order: "-fields.publishDate",
      limit: 200,
    });
    if (res?.items?.length) {
      return res.items.map((item) => ({
        id: String(item.fields.slug || item.sys.id),
        title: String(item.fields.title || "Untitled"),
        excerpt: String(item.fields.excerpt || ""),
        content: String(item.fields.content || ""),
        author: String(item.fields.authorName || "Shruti Turner"),
        date: String(item.fields.publishDate || ""),
        tags: parseStringArray(item.fields.tags),
        readTime: String(item.fields.readTime || ""),
        seoTitle: item.fields.seoTitle ? String(item.fields.seoTitle) : undefined,
        seoDescription: item.fields.seoDescription
          ? String(item.fields.seoDescription)
          : undefined,
      }));
    }
  }

  return LOCAL_BLOG_POSTS;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostContent | null> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.id === slug) || null;
}

export async function getClassDefinitions(): Promise<ClassDefinitionContent[]> {
  if (prefersContentfulSource()) {
    const res = await getEntries<Record<string, unknown>>("classDefinition", { limit: 300 });
    if (res?.items?.length) {
      return res.items.map((item) => ({
        id: String(item.sys.id),
        slug: String(item.fields.slug || item.sys.id),
        name: String(item.fields.name || "Untitled class"),
        type: (String(item.fields.type || "Yoga") as "Yoga" | "Strength" | "HIIT"),
        day: String(item.fields.defaultDay || "Monday"),
        time: String(item.fields.defaultTime || "09:00"),
        duration: String(item.fields.duration || "60 min"),
        level: String(item.fields.level || "All levels"),
        maxSpaces: Number(item.fields.maxCapacity || 12),
        shortDescription: String(item.fields.shortDescription || ""),
        longDescription: String(item.fields.longDescription || ""),
        whatToExpect: parseStringArray(item.fields.whatToExpect),
        whoItsFor: parseStringArray(item.fields.whoItsFor),
        equipment: parseStringArray(item.fields.equipment),
        benefits: parseStringArray(item.fields.benefits),
        instructor: String(item.fields.instructorName || "Shruti Turner"),
        seoTitle: String(item.fields.seoTitle || item.fields.name || "Class"),
        seoDescription: String(item.fields.seoDescription || item.fields.shortDescription || ""),
        seoKeywords: String(item.fields.seoKeywords || ""),
      }));
    }
  }

  return LOCAL_CLASS_DEFINITIONS;
}

export async function getClassDefinitionBySlug(slug: string): Promise<ClassDefinitionContent | null> {
  const defs = await getClassDefinitions();
  return defs.find((d) => d.slug === slug) || null;
}

export async function getScheduleByDayContent(): Promise<ScheduleDay[]> {
  // Backend schedule instances are source of truth. In this codebase that data is local mock.
  if (allowsLocalFallback()) {
    return getLocalScheduleByDay();
  }

  return getScheduleByDay();
}

export async function getRetreatTemplates(): Promise<RetreatTemplateContent[]> {
  if (prefersContentfulSource()) {
    const res = await getEntries<Record<string, unknown>>("retreatTemplate", { limit: 200 });
    if (res?.items?.length) {
      return res.items.map((item) => ({
        id: String(item.sys.id),
        slug: String(item.fields.slug || item.sys.id),
        title: String(item.fields.title || "Untitled retreat"),
        subtitle: String(item.fields.subtitle || ""),
        shortDescription: String(item.fields.shortDescription || ""),
        fullDescription: String(item.fields.fullDescription || ""),
        suitableFor: parseStringArray(item.fields.suitableFor),
        included: parseStringArray(item.fields.included),
        notIncluded: parseStringArray(item.fields.notIncluded),
        seoTitle: item.fields.seoTitle ? String(item.fields.seoTitle) : undefined,
        seoDescription: item.fields.seoDescription ? String(item.fields.seoDescription) : undefined,
        venueSlug: item.fields.venueSlug ? String(item.fields.venueSlug) : undefined,
      }));
    }
  }

  return LOCAL_RETREAT_TEMPLATES;
}

export async function getRetreatInstances(): Promise<RetreatInstanceContent[]> {
  // Backend/admin-managed source of truth for run dates and pricing.
  return LOCAL_RETREAT_INSTANCES;
}

export async function getRetreatVenues(): Promise<RetreatVenueContent[]> {
  if (prefersContentfulSource()) {
    const res = await getEntries<Record<string, unknown>>("retreatVenue", { limit: 100 });
    if (res?.items?.length) {
      return res.items.map((item) => ({
        slug: String(item.fields.slug || item.sys.id),
        name: String(item.fields.name || "Venue"),
        displayLocation: String(item.fields.displayLocation || item.fields.name || "Venue"),
        description: item.fields.description ? String(item.fields.description) : undefined,
        accommodationType: item.fields.accommodationType
          ? String(item.fields.accommodationType)
          : undefined,
      }));
    }
  }

  return LOCAL_RETREAT_VENUES;
}

export async function getRetreatsCombined(): Promise<RetreatCombinedContent[]> {
  const [templates, instances, venues] = await Promise.all([
    getRetreatTemplates(),
    getRetreatInstances(),
    getRetreatVenues(),
  ]);

  const combined = combineRetreats(templates, instances, venues);
  return combined.length ? combined : LOCAL_RETREATS_COMBINED;
}

export async function getRetreatBySlugCombined(slug: string): Promise<RetreatCombinedContent | null> {
  const retreats = await getRetreatsCombined();
  return retreats.find((r) => r.slug === slug) || null;
}
