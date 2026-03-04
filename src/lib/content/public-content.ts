import { getScheduleByDay } from "@/data/schedule-data";
import {
  LOCAL_CLASS_DEFINITIONS,
  LOCAL_GLOBAL_CONTENT,
  LOCAL_LEGAL_DOCUMENTS,
  LOCAL_NEWSLETTER_SIGNUP_CONTENT,
  LOCAL_PAGE_CONTENT,
  LOCAL_RETREAT_INSTANCES,
  getLocalScheduleByDay,
} from "./local-content";
import { getContentSource } from "./config";
import { getEntries, getEntryBySlug } from "./contentful-client";
import type {
  BlogPostContent,
  ClassDefinitionContent,
  ContactBlockContent,
  GlobalContent,
  LeadMagnetContent,
  LegalDocumentContent,
  NewsletterSignupContent,
  NewsletterTemplateContent,
  PageContent,
  RetreatCombinedContent,
  RetreatInstanceContent,
  RetreatTemplateContent,
  RetreatVenueContent,
  SeoContent,
  AnnouncementBannerContent,
  FaqItemContent,
  TestimonialContent,
  TransactionalEmailTemplateContent,
  TrustBadgeContent,
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

function getLinkedEntryId(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("sys" in value)) {
    return undefined;
  }

  const id = (value as { sys?: { id?: string } }).sys?.id;
  return id ? String(id) : undefined;
}

function getIncludedEntryById(
  includes: Array<{ sys: { id: string }; fields: Record<string, unknown> }> | undefined,
  id: string | undefined
) {
  if (!includes || !id) return null;
  return includes.find((entry) => entry.sys.id === id) || null;
}

function combineRetreats(
  templates: RetreatTemplateContent[],
  instances: RetreatInstanceContent[],
  venues: RetreatVenueContent[]
): RetreatCombinedContent[] {
  const venueBySlug = new Map(venues.map((v) => [v.slug, v]));
  const venueById = new Map(
    venues.filter((v) => v.id).map((v) => [String(v.id), v] as const)
  );
  const combined: RetreatCombinedContent[] = [];

  for (const template of templates) {
    const templateInstances = instances.filter((i) => i.templateSlug === template.slug);
    if (templateInstances.length === 0) continue;

    const sorted = [...templateInstances].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const first = sorted[0];
    const venue =
      (template.venueId ? venueById.get(template.venueId) : undefined) ||
      (template.venueSlug ? venueBySlug.get(template.venueSlug) : undefined);

    combined.push({
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
      venueId: venue?.id,
      venueSlug: venue?.slug,
      venueName: venue?.name,
    });
  }

  return combined;
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
  // Generic page metadata is intentionally local-defined.
  return LOCAL_PAGE_CONTENT[slug] || null;
}

export async function getPageSeo(slug: string): Promise<SeoContent | null> {
  const page = await getPageContent(slug);
  return page?.seo || null;
}

export async function getLegalDocumentBySlug(slug: string): Promise<LegalDocumentContent | null> {
  if (prefersContentfulSource()) {
    const entry = await getEntryBySlug<Record<string, unknown>>("legalDocument", slug);
    if (entry) {
      return {
        id: String(entry.sys.id),
        slug,
        title: String(entry.fields.title || slug),
        version: String(entry.fields.version || "1.0"),
        effectiveDate: entry.fields.effectiveDate ? String(entry.fields.effectiveDate) : undefined,
        body: String(entry.fields.body || ""),
        seoTitle: entry.fields.seoTitle ? String(entry.fields.seoTitle) : undefined,
        seoDescription: entry.fields.seoDescription ? String(entry.fields.seoDescription) : undefined,
      };
    }
  }

  return LOCAL_LEGAL_DOCUMENTS.find((doc) => doc.slug === slug) || null;
}

export async function getNewsletterSignupContent(): Promise<NewsletterSignupContent> {
  if (prefersContentfulSource()) {
    const res = await getEntries<Record<string, unknown>>("newsletterSignupContent", {
      "fields.slug": "default",
      limit: 1,
      include: 2,
    });
    const entry = res?.items?.[0];
    if (entry) {
      const leadMagnetId = getLinkedEntryId(entry.fields.activeLeadMagnet);
      const leadMagnetEntry = getIncludedEntryById(res.includes?.Entry, leadMagnetId);
      const leadMagnetFields = leadMagnetEntry?.fields;

      return {
        slug: "default",
        hookText: String(leadMagnetFields?.hookText || LOCAL_NEWSLETTER_SIGNUP_CONTENT.hookText),
        formPlaceholder: String(
          entry.fields.formPlaceholder || LOCAL_NEWSLETTER_SIGNUP_CONTENT.formPlaceholder
        ),
        buttonLabel: String(entry.fields.buttonLabel || LOCAL_NEWSLETTER_SIGNUP_CONTENT.buttonLabel),
        successMessage: String(
          entry.fields.successMessage || LOCAL_NEWSLETTER_SIGNUP_CONTENT.successMessage
        ),
        consentText: String(entry.fields.consentText || LOCAL_NEWSLETTER_SIGNUP_CONTENT.consentText),
        popupTitle: entry.fields.popupTitle
          ? String(entry.fields.popupTitle)
          : LOCAL_NEWSLETTER_SIGNUP_CONTENT.popupTitle,
        popupDescription: entry.fields.popupDescription
          ? String(entry.fields.popupDescription)
          : LOCAL_NEWSLETTER_SIGNUP_CONTENT.popupDescription,
        leadMagnetSlug: leadMagnetFields?.slug
          ? String(leadMagnetFields.slug)
          : LOCAL_NEWSLETTER_SIGNUP_CONTENT.leadMagnetSlug,
        leadMagnetTitle: leadMagnetFields?.title
          ? String(leadMagnetFields.title)
          : LOCAL_NEWSLETTER_SIGNUP_CONTENT.leadMagnetTitle,
        emailSubject: leadMagnetFields?.emailSubject
          ? String(leadMagnetFields.emailSubject)
          : LOCAL_NEWSLETTER_SIGNUP_CONTENT.emailSubject,
        emailPreviewText: leadMagnetFields?.emailPreviewText
          ? String(leadMagnetFields.emailPreviewText)
          : LOCAL_NEWSLETTER_SIGNUP_CONTENT.emailPreviewText,
        emailBody: leadMagnetFields?.emailBody
          ? String(leadMagnetFields.emailBody)
          : LOCAL_NEWSLETTER_SIGNUP_CONTENT.emailBody,
        deliveryType:
          leadMagnetFields?.deliveryType && String(leadMagnetFields.deliveryType) === "inline"
            ? "inline"
            : LOCAL_NEWSLETTER_SIGNUP_CONTENT.deliveryType,
        assetUrl: leadMagnetFields?.assetUrl
          ? String(leadMagnetFields.assetUrl)
          : LOCAL_NEWSLETTER_SIGNUP_CONTENT.assetUrl,
      };
    }
  }

  return LOCAL_NEWSLETTER_SIGNUP_CONTENT;
}

export async function getLeadMagnetBySlug(slug: string): Promise<LeadMagnetContent | null> {
  if (prefersContentfulSource()) {
    const entry = await getEntryBySlug<Record<string, unknown>>("leadMagnet", slug);
    if (entry) {
      return {
        id: String(entry.sys.id),
        slug: String(entry.fields.slug || slug),
        title: String(entry.fields.title || ""),
        hookText: String(entry.fields.hookText || ""),
        emailSubject: String(entry.fields.emailSubject || ""),
        emailPreviewText: entry.fields.emailPreviewText
          ? String(entry.fields.emailPreviewText)
          : undefined,
        emailBody: String(entry.fields.emailBody || ""),
        deliveryType: entry.fields.deliveryType === "inline" ? "inline" : "link",
        assetUrl: entry.fields.assetUrl ? String(entry.fields.assetUrl) : undefined,
        active: Boolean(entry.fields.active),
        startAt: entry.fields.startAt ? String(entry.fields.startAt) : undefined,
        endAt: entry.fields.endAt ? String(entry.fields.endAt) : undefined,
      };
    }
  }

  if (slug === LOCAL_NEWSLETTER_SIGNUP_CONTENT.leadMagnetSlug) {
    return {
      id: `local-${slug}`,
      slug,
      title: LOCAL_NEWSLETTER_SIGNUP_CONTENT.leadMagnetTitle || slug,
      hookText: LOCAL_NEWSLETTER_SIGNUP_CONTENT.hookText,
      emailSubject: LOCAL_NEWSLETTER_SIGNUP_CONTENT.emailSubject || "",
      emailPreviewText: LOCAL_NEWSLETTER_SIGNUP_CONTENT.emailPreviewText,
      emailBody: LOCAL_NEWSLETTER_SIGNUP_CONTENT.emailBody || "",
      deliveryType: LOCAL_NEWSLETTER_SIGNUP_CONTENT.deliveryType || "link",
      assetUrl: LOCAL_NEWSLETTER_SIGNUP_CONTENT.assetUrl,
      active: true,
    };
  }

  return null;
}

export async function getFaqItems(): Promise<FaqItemContent[]> {
  if (!prefersContentfulSource()) {
    return [];
  }

  const res = await getEntries<Record<string, unknown>>("faqItem", {
    limit: 300,
    order: "fields.sortOrder",
  });
  if (!res?.items?.length) return [];

  return res.items.map((item) => ({
    slug: String(item.fields.slug || item.sys.id),
    question: String(item.fields.question || ""),
    answer: String(item.fields.answer || ""),
    category: item.fields.category ? String(item.fields.category) : undefined,
    targetPage: item.fields.targetPage ? String(item.fields.targetPage) : undefined,
    targetSection: item.fields.targetSection ? String(item.fields.targetSection) : undefined,
    sortOrder: item.fields.sortOrder ? Number(item.fields.sortOrder) : undefined,
  }));
}

export async function getFaqItemsFor(
  page: string,
  section?: string
): Promise<FaqItemContent[]> {
  const items = await getFaqItems();
  const scoped = items.filter((item) => {
    const pageTarget = item.targetPage?.trim().toLowerCase();
    const sectionTarget = item.targetSection?.trim().toLowerCase();
    const normalizedPage = page.trim().toLowerCase();
    const normalizedSection = section?.trim().toLowerCase();

    const pageMatch = !pageTarget || pageTarget === "general" || pageTarget === normalizedPage;
    if (!pageMatch) return false;

    if (!normalizedSection) {
      return true;
    }

    return !sectionTarget || sectionTarget === normalizedSection;
  });

  return scoped.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export async function getTrustBadges(): Promise<TrustBadgeContent[]> {
  if (!prefersContentfulSource()) {
    return [];
  }

  const res = await getEntries<Record<string, unknown>>("trustBadge", { limit: 200 });
  if (!res?.items?.length) return [];

  return res.items.map((item) => ({
    slug: String(item.fields.slug || item.sys.id),
    title: String(item.fields.title || ""),
    description: item.fields.description ? String(item.fields.description) : undefined,
    iconKey: item.fields.iconKey ? String(item.fields.iconKey) : undefined,
  }));
}

export async function getContactBlocks(): Promise<ContactBlockContent[]> {
  if (!prefersContentfulSource()) {
    return [];
  }

  const res = await getEntries<Record<string, unknown>>("contactBlock", { limit: 50 });
  if (!res?.items?.length) return [];

  return res.items.map((item) => ({
    slug: String(item.fields.slug || item.sys.id),
    title: String(item.fields.title || ""),
    body: item.fields.body ? String(item.fields.body) : undefined,
    email: item.fields.email ? String(item.fields.email) : undefined,
    phone: item.fields.phone ? String(item.fields.phone) : undefined,
    ctaLabel: item.fields.ctaLabel ? String(item.fields.ctaLabel) : undefined,
    ctaHref: item.fields.ctaHref ? String(item.fields.ctaHref) : undefined,
  }));
}

export async function getAnnouncementBanners(): Promise<AnnouncementBannerContent[]> {
  if (!prefersContentfulSource()) {
    return [];
  }

  const res = await getEntries<Record<string, unknown>>("announcementBanner", { limit: 20 });
  if (!res?.items?.length) return [];

  return res.items.map((item) => ({
    slug: String(item.fields.slug || item.sys.id),
    message: String(item.fields.message || ""),
    ctaLabel: item.fields.ctaLabel ? String(item.fields.ctaLabel) : undefined,
    ctaHref: item.fields.ctaHref ? String(item.fields.ctaHref) : undefined,
    active: Boolean(item.fields.active),
  }));
}

export async function getTransactionalEmailTemplates(): Promise<TransactionalEmailTemplateContent[]> {
  if (!prefersContentfulSource()) {
    return [];
  }

  const res = await getEntries<Record<string, unknown>>("transactionalEmailTemplate", { limit: 200 });
  if (!res?.items?.length) return [];

  return res.items.map((item) => ({
    slug: String(item.fields.slug || item.sys.id),
    templateKey: String(item.fields.templateKey || ""),
    subject: String(item.fields.subject || ""),
    previewText: item.fields.previewText ? String(item.fields.previewText) : undefined,
    htmlBody: String(item.fields.htmlBody || ""),
    textBody: item.fields.textBody ? String(item.fields.textBody) : undefined,
    status: item.fields.status === "approved" ? "approved" : "draft",
  }));
}

export async function getNewsletterTemplates(): Promise<NewsletterTemplateContent[]> {
  if (!prefersContentfulSource()) {
    return [];
  }

  const res = await getEntries<Record<string, unknown>>("newsletterTemplate", { limit: 200 });
  if (!res?.items?.length) return [];

  return res.items.map((item) => ({
    slug: String(item.fields.slug || item.sys.id),
    title: String(item.fields.title || ""),
    subject: String(item.fields.subject || ""),
    previewText: item.fields.previewText ? String(item.fields.previewText) : undefined,
    body: String(item.fields.body || ""),
    status: item.fields.status === "approved" ? "approved" : "draft",
  }));
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
        seoDescription: item.fields.seoDescription ? String(item.fields.seoDescription) : undefined,
      }));
    }
  }

  return [];
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
        type: String(item.fields.type || "Yoga") as "Yoga" | "Strength" | "HIIT",
        classCategory: item.fields.classCategory
          ? (String(item.fields.classCategory) as "yoga" | "strength" | "small-group")
          : undefined,
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

export async function getClassDefinitionsByCategory(
  category: "yoga" | "strength" | "small-group"
): Promise<ClassDefinitionContent[]> {
  const defs = await getClassDefinitions();
  return defs.filter((d) => {
    const inferredCategory =
      d.classCategory || (d.type === "Yoga" ? "yoga" : d.type === "HIIT" ? "small-group" : "strength");
    return inferredCategory === category;
  });
}

export async function getClassDefinitionBySlug(
  slug: string
): Promise<ClassDefinitionContent | null> {
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
    const res = await getEntries<Record<string, unknown>>("retreatTemplate", {
      limit: 200,
      include: 1,
    });
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
        venueId:
          item.fields.venue &&
          typeof item.fields.venue === "object" &&
          item.fields.venue !== null &&
          "sys" in item.fields.venue
            ? String((item.fields.venue as { sys?: { id?: string } }).sys?.id || "")
            : undefined,
        // Backward compatibility for old local/content entries while migrating.
        venueSlug: item.fields.venueSlug ? String(item.fields.venueSlug) : undefined,
      }));
    }
  }

  return [];
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
        id: String(item.sys.id),
        slug: String(item.fields.slug || item.sys.id),
        name: String(item.fields.name || "Venue"),
        displayLocation: String(item.fields.displayLocation || item.fields.name || "Venue"),
        description: item.fields.description ? String(item.fields.description) : undefined,
        address: item.fields.address ? String(item.fields.address) : undefined,
        accommodationOptions: parseStringArray(item.fields.accommodationOptions),
        travelInformation: item.fields.travelInformation
          ? String(item.fields.travelInformation)
          : undefined,
        accommodationType: item.fields.accommodationType
          ? String(item.fields.accommodationType)
          : undefined,
        facilities: parseStringArray(item.fields.facilities),
        accessibilityNotes: item.fields.accessibilityNotes
          ? String(item.fields.accessibilityNotes)
          : undefined,
      }));
    }
  }

  return [];
}

export async function getRetreatsCombined(): Promise<RetreatCombinedContent[]> {
  const [templates, instances, venues] = await Promise.all([
    getRetreatTemplates(),
    getRetreatInstances(),
    getRetreatVenues(),
  ]);

  return combineRetreats(templates, instances, venues);
}

export async function getTestimonials(
  service?: "yoga" | "strength" | "pt" | "retreat" | "small-group" | "general"
): Promise<TestimonialContent[]> {
  if (!prefersContentfulSource()) {
    return [];
  }

  const query: Record<string, string | number | boolean | undefined> = {
    limit: 200,
  };
  if (service) {
    query["fields.service"] = service;
  }

  const res = await getEntries<Record<string, unknown>>("testimonial", query);
  if (!res?.items?.length) {
    return [];
  }

  return res.items.map((item) => ({
    id: String(item.sys.id),
    quote: String(item.fields.quote || ""),
    authorName: String(item.fields.authorName || "Anonymous"),
    authorCondition: item.fields.authorCondition
      ? String(item.fields.authorCondition)
      : undefined,
    service: item.fields.service
      ? (String(item.fields.service) as
          | "yoga"
          | "strength"
          | "pt"
          | "retreat"
          | "small-group"
          | "general")
      : undefined,
    featured: Boolean(item.fields.featured),
  }));
}

export async function getRetreatBySlugCombined(
  slug: string
): Promise<RetreatCombinedContent | null> {
  const retreats = await getRetreatsCombined();
  return retreats.find((r) => r.slug === slug) || null;
}
