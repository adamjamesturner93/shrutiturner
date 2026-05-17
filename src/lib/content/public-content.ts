import { blogAuthors as LOCAL_BLOG_AUTHORS, blogPosts as LOCAL_BLOG_POSTS } from "@/data/blog-data";
import { normalizeNewsletterSignupContent } from "@/lib/newsletter/lead-magnet";
import {
  LOCAL_CLASS_DEFINITIONS,
  LOCAL_GLOBAL_CONTENT,
  LOCAL_LEGAL_DOCUMENTS,
  LOCAL_NEWSLETTER_SIGNUP_CONTENT,
  LOCAL_PAGE_CONTENT,
  LOCAL_RETREAT_INSTANCES,
  LOCAL_SMALL_GROUP_PROGRAMMES,
  getLocalScheduleByDay,
} from "./local-content";
import { getContentSource } from "./config";
import { getEntries, getEntryById, getEntryBySlug } from "./contentful-client";
import type {
  BlogPostContent,
  ClassDefinitionContent,
  GlobalContent,
  InstructorProfileContent,
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
  SmallGroupTemplateContent,
  FaqItemContent,
  TestimonialContent,
  AuthorProfileContent,
} from "./types";

type ScheduleDay = ReturnType<typeof getLocalScheduleByDay>[number];

function prefersContentfulSource() {
  return getContentSource() === "contentful";
}

function createMissingContentError(contentType: string, detail: string) {
  return new Error(`CONTENTFUL_CONTENT_MISSING: ${contentType} ${detail}`);
}

function requireContentfulItems<T>(
  contentType: string,
  res: { items?: T[] } | null | undefined
): T[] {
  if (!res?.items?.length) {
    throw createMissingContentError(contentType, "returned no published entries");
  }

  return res.items;
}

function requireStringField(
  contentType: string,
  item: { sys: { id: string }; fields: Record<string, unknown> },
  field: string
) {
  const value = item.fields[field];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  throw createMissingContentError(
    contentType,
    `entry "${item.sys.id}" is missing required field "${field}"`
  );
}

function optionalStringField(fields: Record<string, unknown>, field: string) {
  const value = fields[field];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requireNumberField(
  contentType: string,
  item: { sys: { id: string }; fields: Record<string, unknown> },
  field: string
) {
  const value = Number(item.fields[field]);
  if (Number.isFinite(value)) {
    return value;
  }

  throw createMissingContentError(
    contentType,
    `entry "${item.sys.id}" is missing required numeric field "${field}"`
  );
}

function requireRenderedField(
  contentType: string,
  item: { sys: { id: string }; fields: Record<string, unknown> },
  field: string
) {
  const value = renderContentfulRichText(item.fields[field]);
  if (value.trim()) {
    return value;
  }

  throw createMissingContentError(
    contentType,
    `entry "${item.sys.id}" is missing required field "${field}"`
  );
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function parseObjectArray<T>(
  value: unknown,
  mapper: (item: Record<string, unknown>) => T | null
): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      return mapper(item as Record<string, unknown>);
    })
    .filter((item): item is T => Boolean(item));
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

function getIncludedAssetById(
  includes: Array<{ sys: { id: string }; fields: Record<string, unknown> }> | undefined,
  id: string | undefined
) {
  if (!includes || !id) return null;
  return includes.find((asset) => asset.sys.id === id) || null;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createFallbackAvatar(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

function toContentfulImageUrl(rawUrl: string, width = 1200) {
  const url = rawUrl.startsWith("//") ? `https:${rawUrl}` : rawUrl;
  if (!url.includes("images.ctfassets.net") && !url.includes("images.contentful.com")) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}w=${width}&fm=webp&q=80`;
}

function readContentfulAssetUrl(fields: Record<string, unknown> | undefined) {
  const file = fields?.file;
  if (!file || typeof file !== "object" || Array.isArray(file)) return null;
  const url = (file as { url?: unknown }).url;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

function readContentfulAssetAlt(fields: Record<string, unknown> | undefined) {
  const description = fields?.description;
  if (typeof description === "string" && description.trim()) return description.trim();
  const title = fields?.title;
  if (typeof title === "string" && title.trim()) return title.trim();
  return null;
}

function renderRichTextNode(node: unknown): string {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return "";
  }

  const richNode = node as {
    nodeType?: unknown;
    value?: unknown;
    content?: unknown;
  };
  const nodeType = typeof richNode.nodeType === "string" ? richNode.nodeType : "";

  if (nodeType === "text") {
    return typeof richNode.value === "string" ? richNode.value : "";
  }

  const children = Array.isArray(richNode.content)
    ? richNode.content.map(renderRichTextNode).join("")
    : "";

  if (nodeType === "heading-2") return `\n## ${children.trim()}\n`;
  if (nodeType === "heading-3") return `\n### ${children.trim()}\n`;
  if (nodeType === "paragraph") return `${children.trim()}\n\n`;
  if (nodeType === "list-item") return `- ${children.trim()}\n`;
  if (nodeType === "ordered-list" || nodeType === "unordered-list") return `\n${children}\n`;
  if (nodeType === "blockquote") return `> ${children.trim()}\n\n`;

  return children;
}

function renderContentfulRichText(value: unknown) {
  if (typeof value === "string") return value;
  return renderRichTextNode(value)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mapBlogPostContent(
  item: { sys: { id: string }; fields: Record<string, unknown> },
  includes: {
    Entry?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
    Asset?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
  } = {}
): BlogPostContent {
  const coverImageAssetId = getLinkedEntryId(item.fields.coverImage);
  const coverImageAsset = getIncludedAssetById(includes.Asset, coverImageAssetId);
  const assetUrl = readContentfulAssetUrl(coverImageAsset?.fields);
  const stringCoverImage =
    typeof item.fields.coverImage === "string" && item.fields.coverImage.trim()
      ? item.fields.coverImage.trim()
      : "";
  const slug = requireStringField("blogPost", item, "slug");

  return {
    id: slug,
    title: requireStringField("blogPost", item, "title"),
    excerpt: requireStringField("blogPost", item, "excerpt"),
    content: requireRenderedField("blogPost", item, "content"),
    author: item.fields.authorName ? String(item.fields.authorName) : undefined,
    authors: mapBlogPostAuthors(item, includes.Entry),
    date: requireStringField("blogPost", item, "publishDate"),
    tags: parseStringArray(item.fields.tags),
    readTime: String(item.fields.readTime || ""),
    coverImage: assetUrl
      ? toContentfulImageUrl(assetUrl)
      : stringCoverImage
        ? toContentfulImageUrl(stringCoverImage)
        : "https://images.unsplash.com/photo-1615388599690-02c0d4a3dfa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    coverAlt:
      readContentfulAssetAlt(coverImageAsset?.fields) ||
      (item.fields.coverAlt ? String(item.fields.coverAlt) : "Blog cover image"),
    seoTitle: optionalStringField(item.fields, "seoTitle"),
    seoDescription: optionalStringField(item.fields, "seoDescription"),
  };
}

const localBlogAuthorBySlug = new Map(LOCAL_BLOG_AUTHORS.map((author) => [author.slug, author]));
const localBlogAuthorByName = new Map(
  LOCAL_BLOG_AUTHORS.map((author) => [author.name.toLowerCase(), author])
);

function mapAuthorProfile(
  id: string,
  fields: Record<string, unknown> | null | undefined
): AuthorProfileContent | null {
  if (!fields) return null;

  const name = fields.name ? String(fields.name) : "";
  if (!name) return null;

  return {
    id,
    slug: String(fields.slug || slugify(name) || id),
    name,
    role: fields.role ? String(fields.role) : undefined,
    bio: fields.bio ? String(fields.bio) : "",
    avatarImageUrl: fields.avatarImageUrl
      ? String(fields.avatarImageUrl)
      : createFallbackAvatar(name),
    avatarAlt: fields.avatarAlt ? String(fields.avatarAlt) : `${name} avatar`,
    websiteUrl: fields.websiteUrl ? String(fields.websiteUrl) : undefined,
    instagramHandle: fields.instagramHandle ? String(fields.instagramHandle) : undefined,
    isGuestContributor: fields.isGuestContributor === true,
    active: fields.active !== false,
  };
}

function resolveLegacyAuthor(name: string): AuthorProfileContent {
  const localMatch = localBlogAuthorByName.get(name.toLowerCase());
  if (localMatch) return localMatch;

  return {
    id: slugify(name) || name,
    slug: slugify(name) || name,
    name,
    role: "Contributor",
    bio: "",
    avatarImageUrl: createFallbackAvatar(name),
    avatarAlt: `${name} avatar`,
    isGuestContributor: false,
    active: true,
  };
}

function mapBlogPostAuthors(
  item: { sys: { id: string }; fields: Record<string, unknown> },
  includes: Array<{ sys: { id: string }; fields: Record<string, unknown> }> | undefined
) {
  const linkedAuthors = Array.isArray(item.fields.authors)
    ? item.fields.authors
        .map((authorRef) => {
          const authorId = getLinkedEntryId(authorRef);
          const localAuthor = authorId ? localBlogAuthorBySlug.get(authorId) : undefined;
          if (localAuthor) return localAuthor;
          const linkedEntry = getIncludedEntryById(includes, authorId);
          return mapAuthorProfile(authorId || "", linkedEntry?.fields);
        })
        .filter((author): author is AuthorProfileContent => Boolean(author))
    : [];

  if (linkedAuthors.length > 0) {
    return linkedAuthors;
  }

  const legacyAuthorName = item.fields.authorName
    ? String(item.fields.authorName)
    : "Shruti Turner";
  return [resolveLegacyAuthor(legacyAuthorName)];
}

function combineRetreats(
  templates: RetreatTemplateContent[],
  instances: RetreatInstanceContent[],
  venues: RetreatVenueContent[]
): RetreatCombinedContent[] {
  const venueBySlug = new Map(venues.map((v) => [v.slug, v]));
  const venueById = new Map(venues.filter((v) => v.id).map((v) => [String(v.id), v] as const));
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
        roomOptions: i.roomOptions || [],
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
    if (!entry) {
      throw createMissingContentError("newsletterSignupContent", "default entry was not found");
    }

    const leadMagnetId = getLinkedEntryId(entry.fields.activeLeadMagnet);
    const leadMagnetEntry = getIncludedEntryById(res.includes?.Entry, leadMagnetId);
    const leadMagnetFields = leadMagnetEntry?.fields;
    if (!leadMagnetFields) {
      throw createMissingContentError(
        "newsletterSignupContent",
        "default entry is missing an included activeLeadMagnet"
      );
    }

    return normalizeNewsletterSignupContent({
      slug: "default",
      hookText: requireStringField("leadMagnet", leadMagnetEntry, "hookText"),
      formPlaceholder: requireStringField("newsletterSignupContent", entry, "formPlaceholder"),
      buttonLabel:
        optionalStringField(leadMagnetFields, "ctaLabel") ||
        requireStringField("newsletterSignupContent", entry, "buttonLabel"),
      successMessage: requireStringField("newsletterSignupContent", entry, "successMessage"),
      consentText: requireStringField("newsletterSignupContent", entry, "consentText"),
      popupTitle:
        optionalStringField(leadMagnetFields, "landingHeadline") ||
        optionalStringField(entry.fields, "popupTitle"),
      popupDescription:
        optionalStringField(leadMagnetFields, "landingDescription") ||
        optionalStringField(entry.fields, "popupDescription"),
      leadMagnetSlug: requireStringField("leadMagnet", leadMagnetEntry, "slug"),
      leadMagnetTitle: requireStringField("leadMagnet", leadMagnetEntry, "title"),
      emailSubject: requireStringField("leadMagnet", leadMagnetEntry, "emailSubject"),
      emailPreviewText: optionalStringField(leadMagnetFields, "emailPreviewText"),
      emailBody: requireStringField("leadMagnet", leadMagnetEntry, "emailBody"),
      deliveryType:
        requireStringField("leadMagnet", leadMagnetEntry, "deliveryType") === "inline"
          ? "inline"
          : "link",
      assetUrl: optionalStringField(leadMagnetFields, "assetUrl"),
    });
  }

  return normalizeNewsletterSignupContent(LOCAL_NEWSLETTER_SIGNUP_CONTENT);
}

export async function getLeadMagnetBySlug(slug: string): Promise<LeadMagnetContent | null> {
  if (prefersContentfulSource()) {
    const entry = await getEntryBySlug<Record<string, unknown>>("leadMagnet", slug);
    if (entry) {
      return {
        id: String(entry.sys.id),
        slug: requireStringField("leadMagnet", entry, "slug"),
        title: requireStringField("leadMagnet", entry, "title"),
        hookText: requireStringField("leadMagnet", entry, "hookText"),
        landingHeadline: optionalStringField(entry.fields, "landingHeadline"),
        landingDescription: optionalStringField(entry.fields, "landingDescription"),
        ctaLabel: optionalStringField(entry.fields, "ctaLabel"),
        emailSubject: requireStringField("leadMagnet", entry, "emailSubject"),
        emailPreviewText: optionalStringField(entry.fields, "emailPreviewText"),
        emailBody: requireStringField("leadMagnet", entry, "emailBody"),
        deliveryType:
          requireStringField("leadMagnet", entry, "deliveryType") === "inline" ? "inline" : "link",
        assetUrl: optionalStringField(entry.fields, "assetUrl"),
        active: entry.fields.active === undefined ? undefined : Boolean(entry.fields.active),
        startAt: optionalStringField(entry.fields, "startAt"),
        endAt: optionalStringField(entry.fields, "endAt"),
      };
    }

    throw createMissingContentError("leadMagnet", `entry with slug "${slug}" was not found`);
  }

  if (slug === LOCAL_NEWSLETTER_SIGNUP_CONTENT.leadMagnetSlug) {
    return {
      id: `local-${slug}`,
      slug,
      title: LOCAL_NEWSLETTER_SIGNUP_CONTENT.leadMagnetTitle || slug,
      hookText: LOCAL_NEWSLETTER_SIGNUP_CONTENT.hookText,
      landingHeadline: LOCAL_NEWSLETTER_SIGNUP_CONTENT.popupTitle,
      landingDescription: LOCAL_NEWSLETTER_SIGNUP_CONTENT.popupDescription,
      ctaLabel: LOCAL_NEWSLETTER_SIGNUP_CONTENT.buttonLabel,
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

export async function getFaqItemsFor(page: string, section?: string): Promise<FaqItemContent[]> {
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
      include: 2,
    });
    return requireContentfulItems("blogPost", res).map((item) =>
      mapBlogPostContent(item, res?.includes)
    );
  }

  return LOCAL_BLOG_POSTS;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostContent | null> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.id === slug) || null;
}

export async function getBlogPostPreviewBySlug(slug: string): Promise<BlogPostContent | null> {
  if (!prefersContentfulSource()) {
    return null;
  }

  const res = await getEntries<Record<string, unknown>>(
    "blogPost",
    {
      "fields.slug": slug,
      limit: 1,
      include: 2,
    },
    { preview: true }
  );
  const entry = res?.items?.[0];
  return entry ? mapBlogPostContent(entry, res.includes) : null;
}

export async function getBlogPostStaticParams(): Promise<Array<{ slug: string }>> {
  const posts = await getBlogPosts();
  return posts.filter((post) => post.id.length > 0).map((post) => ({ slug: post.id }));
}

export async function getBlogPostSlugByContentfulEntryId(entryId: string): Promise<string | null> {
  if (!entryId || !prefersContentfulSource()) {
    return null;
  }

  const entry = await getEntryById<Record<string, unknown>>("blogPost", entryId);
  const slug = entry?.fields.slug;
  return typeof slug === "string" && slug.trim() ? slug.trim() : null;
}

export async function getClassDefinitions(): Promise<ClassDefinitionContent[]> {
  if (prefersContentfulSource()) {
    const res = await getEntries<Record<string, unknown>>("classDefinition", { limit: 300 });
    return requireContentfulItems("classDefinition", res).map((item) => ({
      id: String(item.sys.id),
      slug: requireStringField("classDefinition", item, "slug"),
      name: requireStringField("classDefinition", item, "name"),
      type: requireStringField("classDefinition", item, "type") as "Yoga" | "Strength" | "HIIT",
      classCategory: requireStringField("classDefinition", item, "classCategory") as
        | "yoga"
        | "strength"
        | "small-group",
      day: optionalStringField(item.fields, "defaultDay") || "Monday",
      time: optionalStringField(item.fields, "defaultTime") || "09:00",
      duration: requireStringField("classDefinition", item, "duration"),
      level: requireStringField("classDefinition", item, "level"),
      maxSpaces: requireNumberField("classDefinition", item, "maxCapacity"),
      shortDescription: requireStringField("classDefinition", item, "shortDescription"),
      longDescription: requireStringField("classDefinition", item, "longDescription"),
      whatToExpect: parseStringArray(item.fields.whatToExpect),
      whoItsFor: parseStringArray(item.fields.whoItsFor),
      equipment: parseStringArray(item.fields.equipment),
      benefits: parseStringArray(item.fields.benefits),
      instructor: optionalStringField(item.fields, "instructorName") || "Shruti Turner",
      defaultInstructorProfileEntryId: getLinkedEntryId(item.fields.defaultInstructorProfile),
      seoTitle:
        optionalStringField(item.fields, "seoTitle") ||
        requireStringField("classDefinition", item, "name"),
      seoDescription:
        optionalStringField(item.fields, "seoDescription") ||
        requireStringField("classDefinition", item, "shortDescription"),
      seoKeywords: optionalStringField(item.fields, "seoKeywords") || "",
    }));
  }

  return LOCAL_CLASS_DEFINITIONS;
}

export async function getSmallGroupTemplates(): Promise<SmallGroupTemplateContent[]> {
  if (prefersContentfulSource()) {
    const res = await getEntries<Record<string, unknown>>("smallGroupProgramme", {
      limit: 100,
      order: "fields.title",
    });
    return requireContentfulItems("smallGroupProgramme", res).map((item) => ({
      id: String(item.sys.id),
      slug: requireStringField("smallGroupProgramme", item, "slug"),
      title: requireStringField("smallGroupProgramme", item, "title"),
      subtitle: optionalStringField(item.fields, "subtitle"),
      shortSummary: requireStringField("smallGroupProgramme", item, "shortSummary"),
      fullDescription: optionalStringField(item.fields, "fullDescription"),
      longDescription: optionalStringField(item.fields, "longDescription"),
      outcomes: parseStringArray(item.fields.outcomes),
      durationLabel: requireStringField("smallGroupProgramme", item, "durationLabel"),
      durationWeeks:
        item.fields.durationWeeks === undefined ? undefined : Number(item.fields.durationWeeks),
      cohortSize: requireNumberField("smallGroupProgramme", item, "cohortSize"),
      sessionsPerWeek:
        item.fields.sessionsPerWeek === undefined ? undefined : Number(item.fields.sessionsPerWeek),
      defaultPricePence:
        item.fields.defaultPricePence === undefined
          ? undefined
          : Number(item.fields.defaultPricePence),
      whoItsFor: parseStringArray(item.fields.whoItsFor),
      equipment: parseStringArray(item.fields.equipment),
      inclusions: parseStringArray(item.fields.inclusions),
      weekByWeek: parseObjectArray(item.fields.weekByWeek, (week) => {
        const weekNumber = Number(week.weekNumber);
        if (!Number.isFinite(weekNumber) || weekNumber <= 0) return null;
        return {
          weekNumber,
          title: String(week.title || `Week ${weekNumber}`),
          focus: week.focus ? String(week.focus) : undefined,
          sessionTitles: parseStringArray(week.sessionTitles),
        };
      }),
    }));
  }

  return LOCAL_SMALL_GROUP_PROGRAMMES;
}

export async function getSmallGroupTemplateBySlug(
  slug: string
): Promise<SmallGroupTemplateContent | null> {
  const programmes = await getSmallGroupTemplates();
  return programmes.find((programme) => programme.slug === slug) || null;
}

export const getSmallGroupProgrammes = getSmallGroupTemplates;
export const getSmallGroupProgrammeBySlug = getSmallGroupTemplateBySlug;

export async function getInstructorProfiles(): Promise<InstructorProfileContent[]> {
  if (prefersContentfulSource()) {
    const res = await getEntries<Record<string, unknown>>("instructorProfile", { limit: 300 });
    return requireContentfulItems("instructorProfile", res).map((item) => ({
      id: String(item.sys.id),
      slug: requireStringField("instructorProfile", item, "slug"),
      name: requireStringField("instructorProfile", item, "name"),
      headline: optionalStringField(item.fields, "headline"),
      bio: requireStringField("instructorProfile", item, "bio"),
      credentials: parseStringArray(item.fields.credentials),
      specialties: parseStringArray(item.fields.specialties),
      avatarImageUrl: optionalStringField(item.fields, "avatarImageUrl"),
      avatarAlt: optionalStringField(item.fields, "avatarAlt"),
      featuredQuote: optionalStringField(item.fields, "featuredQuote"),
      seoTitle: optionalStringField(item.fields, "seoTitle"),
      seoDescription: optionalStringField(item.fields, "seoDescription"),
      active: item.fields.active === undefined ? true : Boolean(item.fields.active),
    }));
  }

  return [
    {
      id: "local-shruti",
      slug: "shruti-turner",
      name: "Shruti Turner",
      headline: "Strength and Yoga Coach",
      bio: "Evidence-based coaching for complex bodies.",
      credentials: [],
      specialties: [],
      active: true,
    },
  ];
}

export async function getInstructorProfilesByIds(
  ids: string[]
): Promise<InstructorProfileContent[]> {
  if (ids.length === 0) return [];
  const all = await getInstructorProfiles();
  const wanted = new Set(ids);
  return all.filter((p) => wanted.has(p.id));
}

export async function getClassDefinitionsByCategory(
  category: "yoga" | "strength" | "small-group"
): Promise<ClassDefinitionContent[]> {
  const defs = await getClassDefinitions();
  return defs.filter((d) => {
    const inferredCategory =
      d.classCategory ||
      (d.type === "Yoga" ? "yoga" : d.type === "HIIT" ? "small-group" : "strength");
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
  if (!prefersContentfulSource()) {
    return getLocalScheduleByDay();
  }

  return [];
}

export async function getRetreatTemplates(): Promise<RetreatTemplateContent[]> {
  if (prefersContentfulSource()) {
    const res = await getEntries<Record<string, unknown>>("retreatTemplate", {
      limit: 200,
      include: 1,
    });
    return requireContentfulItems("retreatTemplate", res).map((item) => ({
      id: String(item.sys.id),
      slug: requireStringField("retreatTemplate", item, "slug"),
      title: requireStringField("retreatTemplate", item, "title"),
      subtitle: requireStringField("retreatTemplate", item, "subtitle"),
      shortDescription: requireStringField("retreatTemplate", item, "shortDescription"),
      fullDescription: requireStringField("retreatTemplate", item, "fullDescription"),
      suitableFor: parseStringArray(item.fields.suitableFor),
      included: parseStringArray(item.fields.included),
      notIncluded: parseStringArray(item.fields.notIncluded),
      seoTitle: optionalStringField(item.fields, "seoTitle"),
      seoDescription: optionalStringField(item.fields, "seoDescription"),
      venueId:
        item.fields.venue &&
        typeof item.fields.venue === "object" &&
        item.fields.venue !== null &&
        "sys" in item.fields.venue
          ? String((item.fields.venue as { sys?: { id?: string } }).sys?.id || "")
          : undefined,
      // Backward compatibility for old local/content entries while migrating.
      venueSlug: optionalStringField(item.fields, "venueSlug"),
    }));
  }

  return [];
}

export async function getRetreatInstances(): Promise<RetreatInstanceContent[]> {
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
    authorCondition: item.fields.authorCondition ? String(item.fields.authorCondition) : undefined,
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
