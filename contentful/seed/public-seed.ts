import { blogPosts } from "../../src/data/blog-data.ts";
import { classDetails } from "../../src/data/schedule-data.ts";
import { retreats } from "../../src/data/retreat-data.ts";

export const GLOBAL_SEED = {
  contentType: "globalContent",
  entries: [
    {
      slug: "global",
      siteName: "Shruti Turner",
      siteTagline: "Strength & Yoga for Complex Bodies",
      defaultSeoDescription:
        "Science-backed strength and yoga coaching for adults with chronic illness, autoimmune conditions, and complex bodies.",
    },
  ],
};

export const PAGE_SEED = {
  contentType: "pageContent",
  entries: [
    { slug: "home", title: "Home", seoTitle: "Strength & Yoga for Complex Bodies" },
    { slug: "classes", title: "Classes", seoTitle: "Classes" },
    { slug: "classes-yoga", title: "Yoga Classes", seoTitle: "Yoga Classes" },
    { slug: "classes-strength", title: "Strength Classes", seoTitle: "Strength Classes" },
    { slug: "classes-small-groups", title: "Small Group Programmes", seoTitle: "Small Group Programmes" },
    { slug: "pt", title: "Personal Training", seoTitle: "Personal Training" },
    { slug: "pricing", title: "Pricing", seoTitle: "Pricing" },
    { slug: "about", title: "About", seoTitle: "About" },
    { slug: "contact", title: "Contact", seoTitle: "Contact" },
    { slug: "schedule", title: "Schedule", seoTitle: "Schedule" },
    { slug: "retreats", title: "Retreats", seoTitle: "Retreats" },
    { slug: "blog", title: "Blog", seoTitle: "Blog" },
  ],
};

export const CLASS_TEMPLATE_SEED = {
  contentType: "classDefinition",
  entries: classDetails.map((c) => ({
    name: c.name,
    slug: c.slug,
    type: c.type,
    level: c.level,
    defaultDay: c.day,
    defaultTime: c.time,
    duration: c.duration,
    maxCapacity: c.maxSpaces,
    shortDescription: c.shortDescription,
    longDescription: c.longDescription,
    whatToExpect: c.whatToExpect,
    whoItsFor: c.whoItsFor,
    equipment: c.equipment,
    benefits: c.benefits,
    seoTitle: c.seoTitle,
    seoDescription: c.seoDescription,
    seoKeywords: c.seoKeywords,
  })),
};

const venueEntries = new Map<string, { slug: string; name: string; displayLocation: string; description: string; accommodationType: string }>();
for (const retreat of retreats) {
  const slug = retreat.slug === "virtual-immersion" ? "online" : retreat.location.toLowerCase().replace(/\s+/g, "-");
  if (!venueEntries.has(slug)) {
    venueEntries.set(slug, {
      slug,
      name: retreat.location,
      displayLocation: retreat.location,
      description: retreat.accommodation,
      accommodationType: retreat.accommodation,
    });
  }
}

export const RETREAT_VENUE_SEED = {
  contentType: "retreatVenue",
  entries: Array.from(venueEntries.values()),
};

export const RETREAT_TEMPLATE_SEED = {
  contentType: "retreatTemplate",
  entries: retreats.map((r) => ({
    title: r.title,
    subtitle: r.subtitle,
    slug: r.slug,
    shortDescription: r.shortDescription,
    fullDescription: r.fullDescription,
    suitableFor: r.suitableFor,
    included: r.included,
    notIncluded: r.notIncluded,
    seoTitle: `${r.title} - ${r.subtitle}`,
    seoDescription: r.shortDescription,
    venueSlug: r.slug === "virtual-immersion" ? "online" : r.location.toLowerCase().replace(/\s+/g, "-"),
  })),
};

export const BLOG_SEED = {
  contentType: "blogPost",
  entries: blogPosts.map((p) => ({
    title: p.title,
    slug: p.id,
    excerpt: p.excerpt,
    content: p.content,
    authorName: p.author,
    publishDate: p.date,
    tags: p.tags,
    readTime: p.readTime,
    isNewsletter: false,
    seoTitle: p.title,
    seoDescription: p.excerpt,
  })),
};

export const SEED_GROUPS = [
  GLOBAL_SEED,
  PAGE_SEED,
  CLASS_TEMPLATE_SEED,
  RETREAT_VENUE_SEED,
  RETREAT_TEMPLATE_SEED,
  BLOG_SEED,
];
