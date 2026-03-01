export type ContentSource = "local" | "hybrid" | "contentful";

export interface SeoContent {
  title: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
}

export interface PageContent {
  slug: string;
  seo: SeoContent;
}

export interface GlobalContent {
  siteName: string;
  siteTagline: string;
  defaultSeoDescription: string;
  headerNavItems?: Array<{ label: string; href: string; children?: Array<{ label: string; href: string }> }>;
  footerNavGroups?: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
}

export interface BlogPostContent {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  tags: string[];
  readTime: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface ClassDefinitionContent {
  id: string;
  slug: string;
  name: string;
  type: "Yoga" | "Strength" | "HIIT";
  day: string;
  time: string;
  duration: string;
  level: string;
  maxSpaces: number;
  shortDescription: string;
  longDescription: string;
  whatToExpect: string[];
  whoItsFor: string[];
  equipment: string[];
  benefits: string[];
  instructor: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

export interface RetreatTemplateContent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  fullDescription: string;
  suitableFor: string[];
  included: string[];
  notIncluded: string[];
  seoTitle?: string;
  seoDescription?: string;
  venueSlug?: string;
}

export interface RetreatVenueContent {
  slug: string;
  name: string;
  displayLocation: string;
  description?: string;
  accommodationType?: string;
}

export interface RetreatInstanceContent {
  id: string;
  templateSlug: string;
  startDate: string;
  endDate: string;
  availableSpaces: number;
  totalSpaces: number;
  earlyBirdPrice: number;
  normalPrice: number;
  earlyBirdDeadline: string;
  currency: string;
}

export interface RetreatCombinedContent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  location: string;
  imageUrl: string;
  shortDescription: string;
  fullDescription: string;
  dates: Array<{
    id: string;
    startDate: string;
    endDate: string;
    availableSpaces: number;
    totalSpaces: number;
  }>;
  earlyBirdPrice: number;
  earlyBirdDeadline: string;
  normalPrice: number;
  currency: string;
  included: string[];
  notIncluded: string[];
  schedule: Array<{ day: string; activities: string[] }>;
  accommodation: string;
  suitableFor: string[];
}
