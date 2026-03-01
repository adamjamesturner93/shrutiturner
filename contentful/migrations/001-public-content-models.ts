export interface ContentTypeDefinition {
  id: string;
  name: string;
  description?: string;
  displayField?: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    required?: boolean;
    localized?: boolean;
    validations?: Array<Record<string, unknown>>;
    items?: Record<string, unknown>;
    linkType?: string;
    disabled?: boolean;
    omitted?: boolean;
  }>;
}

export const PUBLIC_CONTENT_MODELS: ContentTypeDefinition[] = [
  {
    id: "pageContent",
    name: "Page Content",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true },
      { id: "slug", name: "Slug", type: "Symbol", required: true, validations: [{ unique: true }] },
      { id: "seoTitle", name: "SEO Title", type: "Symbol" },
      { id: "seoDescription", name: "SEO Description", type: "Text" },
      { id: "seoKeywords", name: "SEO Keywords", type: "Text" },
      { id: "canonicalUrl", name: "Canonical URL", type: "Symbol" },
      { id: "contentJson", name: "Content JSON", type: "Object" },
    ],
  },
  {
    id: "globalContent",
    name: "Global Content",
    displayField: "siteName",
    fields: [
      { id: "siteName", name: "Site Name", type: "Symbol", required: true },
      { id: "siteTagline", name: "Site Tagline", type: "Symbol", required: true },
      { id: "slug", name: "Slug", type: "Symbol", required: true, validations: [{ unique: true }] },
      { id: "defaultSeoDescription", name: "Default SEO Description", type: "Text", required: true },
      { id: "headerNavItems", name: "Header Nav Items", type: "Object" },
      { id: "footerNavGroups", name: "Footer Nav Groups", type: "Object" },
      { id: "announcementBar", name: "Announcement Bar", type: "Object" },
    ],
  },
  {
    id: "classDefinition",
    name: "Class Definition",
    displayField: "name",
    fields: [
      { id: "name", name: "Name", type: "Symbol", required: true },
      { id: "slug", name: "Slug", type: "Symbol", required: true, validations: [{ unique: true }] },
      { id: "type", name: "Type", type: "Symbol", required: true, validations: [{ in: ["Yoga", "Strength", "HIIT"] }] },
      { id: "level", name: "Level", type: "Symbol", required: true },
      { id: "defaultDay", name: "Default Day", type: "Symbol" },
      { id: "defaultTime", name: "Default Time", type: "Symbol" },
      { id: "duration", name: "Duration", type: "Symbol", required: true },
      { id: "maxCapacity", name: "Max Capacity", type: "Integer", required: true },
      { id: "shortDescription", name: "Short Description", type: "Text", required: true },
      { id: "longDescription", name: "Long Description", type: "Text", required: true },
      { id: "whatToExpect", name: "What To Expect", type: "Array", items: { type: "Symbol" } },
      { id: "whoItsFor", name: "Who It's For", type: "Array", items: { type: "Symbol" } },
      { id: "equipment", name: "Equipment", type: "Array", items: { type: "Symbol" } },
      { id: "benefits", name: "Benefits", type: "Array", items: { type: "Symbol" } },
      { id: "seoTitle", name: "SEO Title", type: "Symbol" },
      { id: "seoDescription", name: "SEO Description", type: "Text" },
      { id: "seoKeywords", name: "SEO Keywords", type: "Text" },
    ],
  },
  {
    id: "retreatVenue",
    name: "Retreat Venue",
    displayField: "name",
    fields: [
      { id: "name", name: "Name", type: "Symbol", required: true },
      { id: "slug", name: "Slug", type: "Symbol", required: true, validations: [{ unique: true }] },
      { id: "displayLocation", name: "Display Location", type: "Symbol", required: true },
      { id: "description", name: "Description", type: "Text" },
      { id: "accommodationType", name: "Accommodation Type", type: "Text" },
      { id: "facilities", name: "Facilities", type: "Array", items: { type: "Symbol" } },
      { id: "accessibilityNotes", name: "Accessibility Notes", type: "Text" },
    ],
  },
  {
    id: "retreatTemplate",
    name: "Retreat Template",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true },
      { id: "subtitle", name: "Subtitle", type: "Symbol", required: true },
      { id: "slug", name: "Slug", type: "Symbol", required: true, validations: [{ unique: true }] },
      { id: "shortDescription", name: "Short Description", type: "Text", required: true },
      { id: "fullDescription", name: "Full Description", type: "Text", required: true },
      { id: "suitableFor", name: "Suitable For", type: "Array", items: { type: "Symbol" } },
      { id: "included", name: "Included", type: "Array", items: { type: "Symbol" } },
      { id: "notIncluded", name: "Not Included", type: "Array", items: { type: "Symbol" } },
      { id: "venueSlug", name: "Venue Slug", type: "Symbol" },
      { id: "seoTitle", name: "SEO Title", type: "Symbol" },
      { id: "seoDescription", name: "SEO Description", type: "Text" },
    ],
  },
  {
    id: "blogPost",
    name: "Blog Post",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true },
      { id: "slug", name: "Slug", type: "Symbol", required: true, validations: [{ unique: true }] },
      { id: "excerpt", name: "Excerpt", type: "Text", required: true },
      { id: "content", name: "Content", type: "Text", required: true },
      { id: "authorName", name: "Author Name", type: "Symbol", required: true },
      { id: "publishDate", name: "Publish Date", type: "Date", required: true },
      { id: "tags", name: "Tags", type: "Array", items: { type: "Symbol" } },
      { id: "readTime", name: "Read Time", type: "Symbol" },
      { id: "isNewsletter", name: "Is Newsletter", type: "Boolean" },
      { id: "seoTitle", name: "SEO Title", type: "Symbol" },
      { id: "seoDescription", name: "SEO Description", type: "Text" },
    ],
  },
  {
    id: "testimonial",
    name: "Testimonial",
    displayField: "authorName",
    fields: [
      { id: "quote", name: "Quote", type: "Text", required: true },
      { id: "authorName", name: "Author Name", type: "Symbol", required: true },
      { id: "authorCondition", name: "Author Condition", type: "Symbol" },
      { id: "service", name: "Service", type: "Symbol", validations: [{ in: ["yoga", "strength", "pt", "retreat", "small-group", "general"] }] },
      { id: "featured", name: "Featured", type: "Boolean" },
    ],
  },
];
