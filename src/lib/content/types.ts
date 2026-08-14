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

export interface SmallGroupProgrammeWeekContent {
  weekNumber: number;
  title: string;
  focus?: string;
  sessionTitles?: string[];
}

export interface SmallGroupTemplateContent {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  shortSummary: string;
  fullDescription?: string;
  longDescription?: string;
  outcomes: string[];
  durationLabel: string;
  durationWeeks?: number;
  cohortSize: number;
  sessionsPerWeek?: number;
  defaultPricePence?: number;
  whoItsFor?: string[];
  equipment?: string[];
  inclusions?: string[];
  weekByWeek?: SmallGroupProgrammeWeekContent[];
}

export type SmallGroupProgrammeContent = SmallGroupTemplateContent;

export interface RetreatRoomOptionContent {
  id: string;
  label: string;
  description: string;
  type: "shared_twin" | "single" | "shared_private" | "virtual";
  guestsIncluded: number;
  capacity: number;
  availableSpots: number;
  earlyBirdPricePence?: number;
  normalPricePence: number;
  depositPence?: number;
  isWaitlistOnly?: boolean;
}

export interface GlobalContent {
  siteName: string;
  siteTagline: string;
  defaultSeoDescription: string;
  headerNavItems?: Array<{
    label: string;
    href: string;
    children?: Array<{ label: string; href: string }>;
  }>;
  footerNavGroups?: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
}

export interface LegalDocumentContent {
  id: string;
  slug:
    | "terms"
    | "privacy"
    | "cookies"
    | "health-declaration"
    | "refund-policy"
    | "acceptable-use"
    | "coaching-agreement"
    | (string & {});
  title: string;
  version: string;
  effectiveDate?: string;
  body: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface NewsletterSignupContent {
  slug: string;
  hookText: string;
  formPlaceholder: string;
  buttonLabel: string;
  successMessage: string;
  consentText: string;
  popupTitle?: string;
  popupDescription?: string;
  leadMagnetSlug?: string;
  leadMagnetTitle?: string;
  emailSubject?: string;
  emailPreviewText?: string;
  emailBody?: string;
  deliveryType?: "link" | "inline";
  assetUrl?: string;
}

export interface LeadMagnetContent {
  id: string;
  slug: string;
  title: string;
  hookText: string;
  landingHeadline?: string;
  landingDescription?: string;
  ctaLabel?: string;
  emailSubject: string;
  emailPreviewText?: string;
  emailBody: string;
  deliveryType: "link" | "inline";
  assetUrl?: string;
  active?: boolean;
  startAt?: string;
  endAt?: string;
}

export interface FaqItemContent {
  slug: string;
  question: string;
  answer: string;
  category?: string;
  targetPage?: string;
  targetSection?: string;
  sortOrder?: number;
}

export interface NewsletterTemplateContent {
  slug: string;
  title: string;
  subject: string;
  previewText?: string;
  body: string;
}

export interface BlogPostContent {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author?: string;
  authors: AuthorProfileContent[];
  date: string;
  tags: string[];
  category?: "rehabilitation" | "fitness" | "wellbeing";
  readTime: string;
  coverImage: string;
  coverAlt: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface AuthorProfileContent {
  id: string;
  slug: string;
  name: string;
  role?: string;
  bio: string;
  avatarImageUrl?: string;
  avatarAlt?: string;
  websiteUrl?: string;
  instagramHandle?: string;
  isGuestContributor?: boolean;
  active?: boolean;
}

export interface ClassDefinitionContent {
  id: string;
  slug: string;
  name: string;
  type: "Yoga" | "Strength" | "HIIT";
  classCategory?: "yoga" | "strength" | "small-group";
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
  defaultInstructorProfileEntryId?: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

export interface InstructorProfileContent {
  id: string;
  slug: string;
  name: string;
  headline?: string;
  bio: string;
  credentials: string[];
  specialties: string[];
  avatarImageUrl?: string;
  avatarAlt?: string;
  featuredQuote?: string;
  seoTitle?: string;
  seoDescription?: string;
  active: boolean;
}

export interface TestimonialContent {
  id: string;
  quote: string;
  authorName: string;
  featured?: boolean;
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
  venueId?: string;
  venueSlug?: string;
}

export interface RetreatVenueContent {
  id?: string;
  slug: string;
  name: string;
  displayLocation: string;
  description?: string;
  address?: string;
  accommodationOptions?: string[];
  travelInformation?: string;
  accommodationType?: string;
  facilities?: string[];
  accessibilityNotes?: string;
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
  roomOptions?: RetreatRoomOptionContent[];
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
    roomOptions: RetreatRoomOptionContent[];
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
  venueId?: string;
  venueSlug?: string;
  venueName?: string;
}
