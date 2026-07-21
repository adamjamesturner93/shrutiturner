import { normalizeNewsletterSignupContent } from "@/lib/newsletter/lead-magnet";
import { LEGAL_DOCUMENTS } from "@/data/legal-documents";
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
  RetreatPaymentPlanContent,
  RetreatRoomOptionContent,
  RetreatTemplateContent,
  RetreatScheduleDayContent,
  RetreatVenueContent,
  SeoContent,
  SmallGroupTemplateContent,
  FaqItemContent,
  TestimonialContent,
  AuthorProfileContent,
} from "./types";

type ScheduleDay = {
  day: string;
  classes: ClassDefinitionContent[];
};

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

function requireDateField(
  contentType: string,
  item: { sys: { id: string }; fields: Record<string, unknown> },
  field: string
) {
  const value = item.fields[field];
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) return value.trim();
  throw createMissingContentError(
    contentType,
    `entry "${item.sys.id}" is missing required date field "${field}"`
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseRetreatRoomOptions(value: unknown): RetreatRoomOptionContent[] {
  const rawOptions = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.options)
      ? value.options
      : [];

  return rawOptions.filter(isRecord).map((option, index): RetreatRoomOptionContent => {
    const id =
      typeof option.id === "string" && option.id.trim() ? option.id.trim() : `room-${index + 1}`;
    const normalPricePence =
      typeof option.normalPricePence === "number"
        ? option.normalPricePence
        : typeof option.pricePence === "number"
          ? option.pricePence
          : 0;
    const capacity = typeof option.capacity === "number" ? option.capacity : 0;
    const ratePlans = Array.isArray(option.ratePlans)
      ? option.ratePlans.filter(isRecord).map((ratePlan, rateIndex) => ({
          id:
            typeof ratePlan.id === "string" && ratePlan.id.trim()
              ? ratePlan.id.trim()
              : `${id}-${rateIndex + 1}`,
          guestCount:
            typeof ratePlan.guestCount === "number"
              ? Math.max(Math.trunc(ratePlan.guestCount), 1)
              : 1,
          totalPricePence:
            typeof ratePlan.totalPricePence === "number"
              ? Math.max(Math.trunc(ratePlan.totalPricePence), 0)
              : normalPricePence,
          earlyBirdPricePence:
            typeof ratePlan.earlyBirdPricePence === "number"
              ? Math.max(Math.trunc(ratePlan.earlyBirdPricePence), 0)
              : undefined,
          earlyBirdEndsAt:
            typeof ratePlan.earlyBirdEndsAt === "string" ? ratePlan.earlyBirdEndsAt : undefined,
          currency: typeof ratePlan.currency === "string" ? ratePlan.currency : undefined,
        }))
      : undefined;
    const allowedGuestCounts = Array.isArray(option.allowedGuestCounts)
      ? option.allowedGuestCounts
          .filter((count): count is number => typeof count === "number")
          .map((count) => Math.max(Math.trunc(count), 1))
      : ratePlans?.map((ratePlan) => ratePlan.guestCount);
    return {
      id,
      label: typeof option.label === "string" ? option.label : id,
      description: typeof option.description === "string" ? option.description : "",
      type:
        option.type === "single" || option.type === "shared_private" || option.type === "virtual"
          ? option.type
          : "shared_twin",
      bookingUnit:
        option.bookingUnit === "whole_room" ||
        option.bookingUnit === "ticket" ||
        option.bookingUnit === "addon" ||
        option.bookingUnit === "online_live_place"
          ? option.bookingUnit
          : "bed_space",
      guestsIncluded:
        typeof option.guestsIncluded === "number" ? Math.max(option.guestsIncluded, 1) : 1,
      guestCountPerUnit:
        typeof option.guestCountPerUnit === "number"
          ? Math.max(Math.trunc(option.guestCountPerUnit), 1)
          : undefined,
      allowedGuestCounts,
      capacity,
      availableSpots: typeof option.availableSpots === "number" ? option.availableSpots : capacity,
      earlyBirdPricePence:
        typeof option.earlyBirdPricePence === "number" ? option.earlyBirdPricePence : undefined,
      normalPricePence,
      ratePlans,
      pricePerPersonPence:
        typeof option.pricePerPersonPence === "number" ? option.pricePerPersonPence : undefined,
      roomCount: typeof option.roomCount === "number" ? option.roomCount : undefined,
      depositPence: typeof option.depositPence === "number" ? option.depositPence : undefined,
      isWaitlistOnly: option.isWaitlistOnly === true,
    };
  });
}

function parseRetreatPaymentPlan(value: unknown): RetreatPaymentPlanContent | undefined {
  if (!isRecord(value) || !Array.isArray(value.instalments)) return undefined;
  const instalments: RetreatPaymentPlanContent["instalments"] = value.instalments
    .filter(isRecord)
    .map((instalment) => ({
      label: typeof instalment.label === "string" ? instalment.label : "Payment",
      kind:
        instalment.kind === "deposit" ||
        instalment.kind === "scheduled" ||
        instalment.kind === "balance" ||
        instalment.kind === "full_payment"
          ? instalment.kind
          : undefined,
      amountPence: typeof instalment.amountPence === "number" ? instalment.amountPence : undefined,
      percent: typeof instalment.percent === "number" ? instalment.percent : undefined,
      dueDate: typeof instalment.dueDate === "string" ? instalment.dueDate : undefined,
      dueDaysBeforeStart:
        typeof instalment.dueDaysBeforeStart === "number"
          ? instalment.dueDaysBeforeStart
          : undefined,
    }));
  return instalments.length > 0 ? { instalments } : undefined;
}

function parseRetreatSchedule(value: unknown): RetreatScheduleDayContent[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((day, index) => {
    const dayLabel =
      typeof day.day === "string" && day.day.trim() ? day.day.trim() : `Day ${index + 1}`;
    const title = typeof day.title === "string" && day.title.trim() ? day.title.trim() : undefined;
    const items = Array.isArray(day.items)
      ? day.items.filter(isRecord).map((item) => ({
          startTime: typeof item.startTime === "string" ? item.startTime : "",
          endTime: typeof item.endTime === "string" ? item.endTime : undefined,
          title: typeof item.title === "string" ? item.title : "Session",
          description: typeof item.description === "string" ? item.description : undefined,
          category: typeof item.category === "string" ? item.category : undefined,
          isOptional: item.isOptional === true,
        }))
      : [];
    const activities = parseStringArray(day.activities);

    return {
      day: title || dayLabel,
      title,
      activities:
        activities.length > 0
          ? activities
          : items.map((item) => {
              const time = item.endTime ? `${item.startTime}-${item.endTime}` : item.startTime;
              return `${time} ${item.title}`.trim();
            }),
      items,
    };
  });
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

function readImageUrlFromFields(
  fields: Record<string, unknown>,
  assets: Array<{ sys: { id: string }; fields: Record<string, unknown> }> | undefined,
  linkFields: string[],
  urlFields: string[]
) {
  for (const field of linkFields) {
    const assetId = getLinkedEntryId(fields[field]);
    const asset = getIncludedAssetById(assets, assetId);
    const assetUrl = readContentfulAssetUrl(asset?.fields);
    if (assetUrl) return toContentfulImageUrl(assetUrl);
  }

  for (const field of urlFields) {
    const value = optionalStringField(fields, field);
    if (value) return toContentfulImageUrl(value);
  }

  return undefined;
}

function renderRichTextNode(node: unknown): string {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return "";
  }

  const richNode = node as {
    nodeType?: unknown;
    value?: unknown;
    content?: unknown;
    marks?: unknown;
  };
  const nodeType = typeof richNode.nodeType === "string" ? richNode.nodeType : "";

  if (nodeType === "text") {
    let value = typeof richNode.value === "string" ? richNode.value : "";
    const marks = Array.isArray(richNode.marks) ? richNode.marks : [];
    for (const mark of marks) {
      if (!mark || typeof mark !== "object" || Array.isArray(mark)) continue;
      const type = (mark as { type?: unknown }).type;
      if (type === "bold") value = `**${value}**`;
      if (type === "italic") value = `_${value}_`;
      if (type === "code") value = `\`${value}\``;
    }
    return value;
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

type ContentfulMappedEntry = {
  sys: {
    id: string;
    publishedAt?: string;
    updatedAt?: string;
    createdAt?: string;
  };
  fields: Record<string, unknown>;
};

function getContentfulPublishedDate(contentType: string, item: ContentfulMappedEntry) {
  const value = item.sys.publishedAt || item.sys.updatedAt || item.sys.createdAt;
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  throw createMissingContentError(
    contentType,
    `entry "${item.sys.id}" is missing Contentful publish metadata`
  );
}

function mapBlogPostContent(
  item: ContentfulMappedEntry,
  includes: {
    Entry?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
    Asset?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
  } = {}
): BlogPostContent {
  const coverImageAssetId = getLinkedEntryId(item.fields.coverImageAsset);
  const coverImageAsset = getIncludedAssetById(includes.Asset, coverImageAssetId);
  const assetUrl = readContentfulAssetUrl(coverImageAsset?.fields);
  const stringCoverImage =
    typeof item.fields.coverImageUrl === "string" && item.fields.coverImageUrl.trim()
      ? item.fields.coverImageUrl.trim()
      : "";
  const slug = requireStringField("blogPost", item, "slug");
  const authors = mapBlogPostAuthors(item, includes);

  return {
    id: slug,
    title: requireStringField("blogPost", item, "title"),
    excerpt: requireStringField("blogPost", item, "excerpt"),
    content: requireRenderedField("blogPost", item, "content"),
    author: authors.map((author) => author.name).join(", ") || undefined,
    authors,
    date: getContentfulPublishedDate("blogPost", item),
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

function mapAuthorProfile(
  id: string,
  fields: Record<string, unknown> | null | undefined,
  includes?: {
    Asset?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
  }
): AuthorProfileContent | null {
  if (!fields) return null;

  const name = fields.name ? String(fields.name) : "";
  if (!name) return null;
  const avatarAssetId = getLinkedEntryId(fields.avatarImageAsset);
  const avatarAsset = getIncludedAssetById(includes?.Asset, avatarAssetId);
  const avatarAssetUrl = readContentfulAssetUrl(avatarAsset?.fields);
  const avatarUrl =
    avatarAssetUrl ||
    (typeof fields.avatarImageUrl === "string" && fields.avatarImageUrl.trim()
      ? fields.avatarImageUrl.trim()
      : "");

  return {
    id,
    slug: String(fields.slug || slugify(name) || id),
    name,
    role: fields.role ? String(fields.role) : undefined,
    bio: fields.bio ? String(fields.bio) : "",
    avatarImageUrl: avatarUrl ? toContentfulImageUrl(avatarUrl, 256) : createFallbackAvatar(name),
    avatarAlt:
      (fields.avatarAlt ? String(fields.avatarAlt) : "") ||
      readContentfulAssetAlt(avatarAsset?.fields) ||
      `${name} avatar`,
    websiteUrl: fields.websiteUrl ? String(fields.websiteUrl) : undefined,
    instagramHandle: fields.instagramHandle ? String(fields.instagramHandle) : undefined,
    isGuestContributor: fields.isGuestContributor === true,
    active: fields.active !== false,
  };
}

function mapBlogPostAuthors(
  item: ContentfulMappedEntry,
  includes:
    | {
        Entry?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
        Asset?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
      }
    | undefined
) {
  const linkedAuthors = Array.isArray(item.fields.authors)
    ? item.fields.authors
        .map((authorRef) => {
          const authorId = getLinkedEntryId(authorRef);
          const linkedEntry = getIncludedEntryById(includes?.Entry, authorId);
          return mapAuthorProfile(authorId || "", linkedEntry?.fields, includes);
        })
        .filter((author): author is AuthorProfileContent => Boolean(author))
    : [];

  if (linkedAuthors.length > 0) {
    return linkedAuthors;
  }

  throw createMissingContentError(
    "blogPost",
    `entry "${item.sys.id}" is missing linked authorProfile entries`
  );
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
      imageUrl: template.imageUrl || "",
      shortDescription: template.shortDescription,
      fullDescription: template.fullDescription,
      dates: sorted.map((i) => ({
        id: i.id,
        retreatType: i.retreatType,
        timezone: i.timezone,
        startDate: i.startDate,
        endDate: i.endDate,
        availableSpaces: i.availableSpaces,
        totalSpaces: i.totalSpaces,
        roomOptions: i.roomOptions || [],
        paymentPlan: i.paymentPlan,
        payInFullDiscountEnabled: i.payInFullDiscountEnabled,
        refundNotes: i.refundNotes,
        onlineJoiningNotes: i.onlineJoiningNotes,
        instructorProfileSlugs: i.instructorProfileSlugs,
      })),
      earlyBirdPrice: first.earlyBirdPrice,
      earlyBirdDeadline: first.earlyBirdDeadline,
      normalPrice: first.normalPrice,
      currency: first.currency,
      included: template.included,
      notIncluded: template.notIncluded,
      schedule: template.schedule,
      accommodation:
        template.accommodationDescription || venue?.accommodationType || venue?.description || "",
      suitableFor: template.suitableFor,
      experienceType: template.experienceType,
      deliveryMode: template.deliveryMode,
      durationLabel: template.durationLabel,
      audienceDescription: template.audienceDescription,
      experienceLevel: template.experienceLevel,
      foodAndDrinkDescription: template.foodAndDrinkDescription,
      whatToBring: template.whatToBring,
      venueId: venue?.id,
      venueSlug: venue?.slug,
      venueName: venue?.name,
      venue,
    });
  }

  return combined;
}

export async function getGlobalContent(): Promise<GlobalContent> {
  return {
    siteName: "Shruti Turner",
    siteTagline: "Inclusive movement coaching",
    defaultSeoDescription:
      "Inclusive movement coaching for chronic illness, autoimmune conditions, wellbeing and injury recovery or prevention.",
  };
}

export async function getPageContent(slug: string): Promise<PageContent | null> {
  const pageSeo: Record<string, SeoContent> = {
    home: {
      title: "Inclusive Movement Coaching",
      description:
        "Inclusive movement coaching for adults living with chronic illness, autoimmune conditions and injury recovery or prevention.",
    },
    coaching: {
      title: "Coaching",
      description:
        "Personalised movement coaching for chronic illness, autoimmune conditions, wellbeing and injury recovery or prevention.",
    },
    "coaching-apply": { title: "Apply for Coaching" },
    "coaching-personal-programme": { title: "Independent Training Plan" },
    blog: { title: "Blog" },
    about: { title: "About" },
    contact: { title: "Contact" },
    terms: { title: "Terms & Conditions" },
    privacy: { title: "Privacy Policy" },
    cookies: { title: "Cookie Policy" },
    "health-declaration": { title: "Health & Liability Waiver" },
    "refund-policy": { title: "Refund & Cancellation Policy" },
    "acceptable-use": { title: "Acceptable Use Policy" },
    "coaching-agreement": { title: "Coaching Agreement" },
  };
  const seo = pageSeo[slug];
  return seo ? { slug, seo } : null;
}

export async function getPageSeo(slug: string): Promise<SeoContent | null> {
  const page = await getPageContent(slug);
  return page?.seo || null;
}

export async function getLegalDocumentBySlug(slug: string): Promise<LegalDocumentContent | null> {
  return LEGAL_DOCUMENTS.find((doc) => doc.slug === slug) || null;
}

export async function getNewsletterSignupContent(): Promise<NewsletterSignupContent> {
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

export async function getLeadMagnetBySlug(slug: string): Promise<LeadMagnetContent | null> {
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

export async function getFaqItems(): Promise<FaqItemContent[]> {
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
  const res = await getEntries<Record<string, unknown>>("newsletterTemplate", { limit: 200 });
  if (!res?.items?.length) return [];

  return res.items.map((item) => ({
    slug: String(item.fields.slug || item.sys.id),
    title: String(item.fields.title || ""),
    subject: String(item.fields.subject || ""),
    previewText: item.fields.previewText ? String(item.fields.previewText) : undefined,
    body: String(item.fields.body || ""),
  }));
}

export async function getBlogPosts(): Promise<BlogPostContent[]> {
  const res = await getEntries<Record<string, unknown>>("blogPost", {
    order: "-sys.publishedAt",
    limit: 200,
    include: 2,
  });
  return requireContentfulItems("blogPost", res).map((item) =>
    mapBlogPostContent(item, res?.includes)
  );
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostContent | null> {
  const res = await getEntries<Record<string, unknown>>("blogPost", {
    "fields.slug": slug,
    limit: 1,
    include: 2,
  });
  const entry = res?.items?.[0];
  return entry ? mapBlogPostContent(entry, res.includes) : null;
}

export async function getBlogPostPreviewBySlug(slug: string): Promise<BlogPostContent | null> {
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
  if (!entryId) {
    return null;
  }

  const entry = await getEntryById<Record<string, unknown>>("blogPost", entryId);
  const slug = entry?.fields.slug;
  return typeof slug === "string" && slug.trim() ? slug.trim() : null;
}

export async function getClassDefinitions(): Promise<ClassDefinitionContent[]> {
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

export async function getSmallGroupTemplates(): Promise<SmallGroupTemplateContent[]> {
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

export async function getSmallGroupTemplateBySlug(
  slug: string
): Promise<SmallGroupTemplateContent | null> {
  const programmes = await getSmallGroupTemplates();
  return programmes.find((programme) => programme.slug === slug) || null;
}

export const getSmallGroupProgrammes = getSmallGroupTemplates;
export const getSmallGroupProgrammeBySlug = getSmallGroupTemplateBySlug;

export async function getInstructorProfiles(): Promise<InstructorProfileContent[]> {
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
  return [];
}

export async function getRetreatTemplates(): Promise<RetreatTemplateContent[]> {
  const res = await getEntries<Record<string, unknown>>("retreatTemplate", {
    limit: 200,
    include: 1,
  });
  if (!res?.items?.length) return [];
  return res.items.map((item) => ({
    id: String(item.sys.id),
    slug: requireStringField("retreatTemplate", item, "slug"),
    title: requireStringField("retreatTemplate", item, "title"),
    subtitle: requireStringField("retreatTemplate", item, "subtitle"),
    shortDescription: requireStringField("retreatTemplate", item, "shortDescription"),
    fullDescription: requireStringField("retreatTemplate", item, "fullDescription"),
    experienceType:
      item.fields.experienceType === "residential_retreat" ||
      item.fields.experienceType === "day_retreat" ||
      item.fields.experienceType === "online_workshop" ||
      item.fields.experienceType === "in_person_workshop" ||
      item.fields.experienceType === "course"
        ? item.fields.experienceType
        : undefined,
    deliveryMode:
      item.fields.deliveryMode === "in_person" ||
      item.fields.deliveryMode === "online_live" ||
      item.fields.deliveryMode === "online_on_demand" ||
      item.fields.deliveryMode === "hybrid"
        ? item.fields.deliveryMode
        : undefined,
    durationLabel: optionalStringField(item.fields, "durationLabel"),
    audienceDescription: optionalStringField(item.fields, "audienceDescription"),
    experienceLevel: optionalStringField(item.fields, "experienceLevel"),
    imageUrl: readImageUrlFromFields(
      item.fields,
      res.includes?.Asset,
      ["heroImage", "heroImageAsset", "coverImageAsset"],
      ["imageUrl", "heroImageUrl", "coverImageUrl"]
    ),
    suitableFor: parseStringArray(item.fields.suitableFor),
    included: parseStringArray(item.fields.included),
    notIncluded: parseStringArray(item.fields.notIncluded),
    whatToBring: parseStringArray(item.fields.whatToBring),
    foodAndDrinkDescription: optionalStringField(item.fields, "foodAndDrinkDescription"),
    schedule: parseRetreatSchedule(item.fields.schedule),
    accommodationDescription: optionalStringField(item.fields, "accommodationDescription"),
    seoTitle: optionalStringField(item.fields, "seoTitle"),
    seoDescription: optionalStringField(item.fields, "seoDescription"),
    venueId:
      item.fields.venue &&
      typeof item.fields.venue === "object" &&
      item.fields.venue !== null &&
      "sys" in item.fields.venue
        ? String((item.fields.venue as { sys?: { id?: string } }).sys?.id || "")
        : undefined,
    venueSlug: optionalStringField(item.fields, "venueSlug"),
  }));
}

export async function getRetreatInstances(): Promise<RetreatInstanceContent[]> {
  const res = await getEntries<Record<string, unknown>>("retreatInstance", {
    limit: 200,
    include: 2,
    order: "fields.startDate",
  });
  if (!res?.items?.length) return [];

  return res.items.map((item) => {
    const templateId = getLinkedEntryId(item.fields.template);
    const linkedTemplate = getIncludedEntryById(res.includes?.Entry, templateId);
    const templateSlug =
      optionalStringField(item.fields, "templateSlug") ||
      (linkedTemplate ? requireStringField("retreatTemplate", linkedTemplate, "slug") : "");
    if (!templateSlug) {
      throw createMissingContentError(
        "retreatInstance",
        `entry "${item.sys.id}" is missing template or templateSlug`
      );
    }

    const instructorProfileSlugs = Array.isArray(item.fields.instructorProfiles)
      ? item.fields.instructorProfiles
          .map((ref) => {
            const id = getLinkedEntryId(ref);
            const linkedInstructor = getIncludedEntryById(res.includes?.Entry, id);
            return linkedInstructor
              ? optionalStringField(linkedInstructor.fields, "slug")
              : undefined;
          })
          .filter((slug): slug is string => Boolean(slug))
      : [];

    return {
      id: String(item.sys.id),
      templateSlug,
      retreatType: item.fields.retreatType === "online" ? "online" : "in_person",
      timezone: optionalStringField(item.fields, "timezone") || "Europe/London",
      startDate: requireDateField("retreatInstance", item, "startDate"),
      endDate: requireDateField("retreatInstance", item, "endDate"),
      availableSpaces: requireNumberField("retreatInstance", item, "availableSpaces"),
      totalSpaces: requireNumberField("retreatInstance", item, "totalSpaces"),
      earlyBirdPrice: requireNumberField("retreatInstance", item, "earlyBirdPrice"),
      normalPrice: requireNumberField("retreatInstance", item, "normalPrice"),
      earlyBirdDeadline:
        optionalStringField(item.fields, "earlyBirdDeadline") ||
        requireDateField("retreatInstance", item, "startDate"),
      currency: optionalStringField(item.fields, "currency") || "GBP",
      roomOptions: parseRetreatRoomOptions(item.fields.roomOptions),
      paymentPlan: parseRetreatPaymentPlan(item.fields.paymentPlan),
      payInFullDiscountEnabled: item.fields.payInFullDiscountEnabled !== false,
      refundNotes: optionalStringField(item.fields, "refundNotes"),
      onlineJoiningNotes: optionalStringField(item.fields, "onlineJoiningNotes"),
      instructorProfileSlugs,
    };
  });
}

export async function getRetreatVenues(): Promise<RetreatVenueContent[]> {
  const res = await getEntries<Record<string, unknown>>("retreatVenue", { limit: 100 });
  if (!res?.items?.length) return [];

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
    addressLine1: optionalStringField(item.fields, "addressLine1"),
    addressLine2: optionalStringField(item.fields, "addressLine2"),
    townOrCity: optionalStringField(item.fields, "townOrCity"),
    region: optionalStringField(item.fields, "region"),
    postcode: optionalStringField(item.fields, "postcode"),
    country: optionalStringField(item.fields, "country"),
    arrivalInformation: optionalStringField(item.fields, "arrivalInformation"),
    travelByTrain: optionalStringField(item.fields, "travelByTrain"),
    travelByCar: optionalStringField(item.fields, "travelByCar"),
    travelByAir: optionalStringField(item.fields, "travelByAir"),
    localTransferInformation: optionalStringField(item.fields, "localTransferInformation"),
    kitchenAccessDescription: optionalStringField(item.fields, "kitchenAccessDescription"),
  }));
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
