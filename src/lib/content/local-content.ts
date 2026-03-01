import { blogPosts } from "@/data/blog-data";
import {
  classDetails,
  getScheduleByDay,
  type ClassDetail,
} from "@/data/schedule-data";
import {
  retreats,
  type Retreat,
} from "@/data/retreat-data";
import type {
  BlogPostContent,
  ClassDefinitionContent,
  GlobalContent,
  PageContent,
  RetreatCombinedContent,
  RetreatInstanceContent,
  RetreatTemplateContent,
  RetreatVenueContent,
} from "./types";

export const LOCAL_GLOBAL_CONTENT: GlobalContent = {
  siteName: "Shruti Turner",
  siteTagline: "Strength & Yoga for Complex Bodies",
  defaultSeoDescription:
    "Science-backed strength and yoga coaching for adults with chronic illness, autoimmune conditions, and complex bodies.",
};

export const LOCAL_PAGE_CONTENT: Record<string, PageContent> = {
  home: {
    slug: "home",
    seo: {
      title: "Strength & Yoga for Complex Bodies",
      description:
        "Science-backed strength and yoga coaching for adults with chronic illness, autoimmune conditions, and complex bodies.",
    },
  },
  classes: {
    slug: "classes",
    seo: {
      title: "Classes",
      description:
        "Live online yoga and strength classes designed for complex bodies.",
    },
  },
  "classes-yoga": { slug: "classes-yoga", seo: { title: "Yoga Classes" } },
  "classes-strength": { slug: "classes-strength", seo: { title: "Strength Classes" } },
  "classes-small-groups": {
    slug: "classes-small-groups",
    seo: { title: "Small Group Programmes" },
  },
  pt: { slug: "pt", seo: { title: "Personal Training" } },
  pricing: { slug: "pricing", seo: { title: "Pricing" } },
  about: { slug: "about", seo: { title: "About" } },
  contact: { slug: "contact", seo: { title: "Contact" } },
  schedule: { slug: "schedule", seo: { title: "Schedule" } },
  retreats: { slug: "retreats", seo: { title: "Retreats" } },
  blog: { slug: "blog", seo: { title: "Blog" } },
};

export const LOCAL_BLOG_POSTS: BlogPostContent[] = blogPosts;

export const LOCAL_CLASS_DEFINITIONS: ClassDefinitionContent[] =
  classDetails as ClassDetail[];

export const LOCAL_RETREAT_TEMPLATES: RetreatTemplateContent[] = retreats.map((r) => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  subtitle: r.subtitle,
  shortDescription: r.shortDescription,
  fullDescription: r.fullDescription,
  suitableFor: r.suitableFor,
  included: r.included,
  notIncluded: r.notIncluded,
  seoTitle: `${r.title} - ${r.subtitle}`,
  seoDescription: r.shortDescription,
  venueSlug: r.slug === "virtual-immersion" ? "online" : r.location.toLowerCase().replace(/\s+/g, "-"),
}));

const venueMap = new Map<string, RetreatVenueContent>();
for (const retreat of retreats) {
  const slug = retreat.slug === "virtual-immersion" ? "online" : retreat.location.toLowerCase().replace(/\s+/g, "-");
  if (!venueMap.has(slug)) {
    venueMap.set(slug, {
      slug,
      name: retreat.location,
      displayLocation: retreat.location,
      description: retreat.accommodation,
      accommodationType: retreat.accommodation,
    });
  }
}
export const LOCAL_RETREAT_VENUES = Array.from(venueMap.values());

export const LOCAL_RETREAT_INSTANCES: RetreatInstanceContent[] = retreats.flatMap((retreat) =>
  retreat.dates.map((d) => ({
    id: d.id,
    templateSlug: retreat.slug,
    startDate: d.startDate,
    endDate: d.endDate,
    availableSpaces: d.availableSpaces,
    totalSpaces: d.totalSpaces,
    earlyBirdPrice: retreat.earlyBirdPrice,
    normalPrice: retreat.normalPrice,
    earlyBirdDeadline: retreat.earlyBirdDeadline,
    currency: retreat.currency,
  }))
);

export const LOCAL_RETREATS_COMBINED: RetreatCombinedContent[] = retreats as Retreat[];

type ScheduleDay = ReturnType<typeof getScheduleByDay>[number];

export function getLocalScheduleByDay(): ScheduleDay[] {
  return getScheduleByDay();
}
