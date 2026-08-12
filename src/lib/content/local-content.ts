import { classDetails, getScheduleByDay, type ClassDetail } from "@/data/schedule-data";
import { CANONICAL_LEAD_MAGNET } from "@/lib/newsletter/lead-magnet";
import { retreats } from "@/data/retreat-data";
import { LEGAL_DOCUMENTS } from "@/data/legal-documents";
import { smallGroupTemplates } from "@/data/small-group-programmes";
import type {
  LegalDocumentContent,
  ClassDefinitionContent,
  GlobalContent,
  NewsletterSignupContent,
  PageContent,
  RetreatInstanceContent,
  SmallGroupTemplateContent,
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
      title: "Move Well Classes",
      description:
        "Move Well Classes are live online yoga and strength sessions designed for complex bodies.",
    },
  },
  "classes-yoga": { slug: "classes-yoga", seo: { title: "Yoga Classes" } },
  "classes-strength": { slug: "classes-strength", seo: { title: "Strength Classes" } },
  "classes-small-groups": {
    slug: "classes-small-groups",
    seo: { title: "Small Group Programmes" },
  },
  pt: { slug: "pt", seo: { title: "Personal Training" } },
  coaching: {
    slug: "coaching",
    seo: {
      title: "Coaching",
      description:
        "Three tiers of personalised coaching and training support for complex bodies, from independent programming to high-touch 1:1 coaching.",
    },
  },
  "coaching-apply": { slug: "coaching-apply", seo: { title: "Enquire About Coaching" } },
  "coaching-personal-programme": {
    slug: "coaching-personal-programme",
    seo: { title: "Independent Training Plan" },
  },
  pricing: { slug: "pricing", seo: { title: "Pricing" } },
  terms: { slug: "terms", seo: { title: "Terms & Conditions" } },
  privacy: { slug: "privacy", seo: { title: "Privacy Policy" } },
  cookies: { slug: "cookies", seo: { title: "Cookie Policy" } },
  "health-declaration": { slug: "health-declaration", seo: { title: "Health & Liability Waiver" } },
  "refund-policy": { slug: "refund-policy", seo: { title: "Refund & Cancellation Policy" } },
  "acceptable-use": { slug: "acceptable-use", seo: { title: "Acceptable Use Policy" } },
  "coaching-agreement": { slug: "coaching-agreement", seo: { title: "Coaching Agreement" } },
  about: { slug: "about", seo: { title: "About" } },
  contact: { slug: "contact", seo: { title: "Contact" } },
  schedule: { slug: "schedule", seo: { title: "Schedule" } },
  retreats: { slug: "retreats", seo: { title: "Retreats" } },
  blog: { slug: "blog", seo: { title: "Blog" } },
};

export const LOCAL_CLASS_DEFINITIONS: ClassDefinitionContent[] = classDetails as ClassDetail[];
export const LOCAL_SMALL_GROUP_PROGRAMMES: SmallGroupTemplateContent[] = smallGroupTemplates;

export const LOCAL_LEGAL_DOCUMENTS: LegalDocumentContent[] = LEGAL_DOCUMENTS;

export const LOCAL_NEWSLETTER_SIGNUP_CONTENT: NewsletterSignupContent = {
  slug: "default",
  hookText: CANONICAL_LEAD_MAGNET.hookText,
  formPlaceholder: "your.email@example.com",
  buttonLabel: "Subscribe",
  successMessage: "Please check your inbox to confirm your email address.",
  consentText: "No spam. Unsubscribe anytime.",
  popupTitle: "Get Evidence-Based Insights",
  popupDescription:
    "Join the mailing list for new writing, useful resources and occasional offers. No spam, unsubscribe anytime.",
  leadMagnetSlug: CANONICAL_LEAD_MAGNET.slug,
  leadMagnetTitle: CANONICAL_LEAD_MAGNET.title,
  emailSubject: "Confirm your email to get your free guide",
  emailPreviewText: "Confirm your email to receive the guide.",
  emailBody:
    "Hi {{firstName}},\n\nConfirm your email to receive your free guide.\n\n{{leadMagnetLink}}\n\nShruti",
  deliveryType: "link",
  assetUrl: CANONICAL_LEAD_MAGNET.assetUrl,
};

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
    roomOptions: d.roomOptions,
  }))
);

type ScheduleDay = ReturnType<typeof getScheduleByDay>[number];

export function getLocalScheduleByDay(): ScheduleDay[] {
  return getScheduleByDay();
}
