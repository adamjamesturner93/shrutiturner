import type { NewsletterSignupContent } from "@/lib/content/types";

const LEGACY_LEAD_MAGNET = {
  assetUrl: "https://shrutiturner.co.uk/resources/5-yoga-poses-strength",
  hookText: 'Get "5 Yoga Poses That Actually Build Strength":',
  slug: "5-yoga-poses-strength",
  title: "5 Yoga Poses That Actually Build Strength",
};

export const NEWSLETTER_HEADLINE =
  "Been told to be careful with exercise because of pain, injury or illness?";
export const NEWSLETTER_BODY =
  "Learn how to train intelligently, rebuild confidence and build strength in a way that works with your body.";
export const NEWSLETTER_BUTTON = "Get the free guide";
export const FREE_GUIDE_TITLE =
  "Rebuild Your Strength: How to train intelligently with chronic illness, pain or injury.";
export const FREE_GUIDE_SUPPORTING_LINE = NEWSLETTER_BODY;
export const FREE_GUIDE_META_DESCRIPTION =
  "Get Rebuild Your Strength, Shruti Turner's free guide to training intelligently with chronic illness, pain or injury.";
export const FREE_GUIDE_KEY = "rebuild-your-strength";
export const FREE_GUIDE_POSTMARK_TAG = `lead-magnet-${FREE_GUIDE_KEY}`;
export const FREE_GUIDE_DOWNLOAD_PATH = "/guides/rebuild-your-strength.pdf";

export const CANONICAL_LEAD_MAGNET = {
  assetUrl: `https://shrutiturner.co.uk${FREE_GUIDE_DOWNLOAD_PATH}`,
  cardDescription: FREE_GUIDE_SUPPORTING_LINE,
  cardTitle: FREE_GUIDE_TITLE,
  emailBody: `Hi {{firstName}},\n\nThanks for joining. Here is your guide: ${FREE_GUIDE_TITLE}.\n\n{{leadMagnetLink}}\n\nShruti`,
  emailPreviewText: "Confirm your email to receive the guide.",
  emailSubject: `Your free guide: ${FREE_GUIDE_TITLE}`,
  hookText: NEWSLETTER_HEADLINE,
  landingDescription: FREE_GUIDE_SUPPORTING_LINE,
  slug: FREE_GUIDE_KEY,
  subscribeBenefits: [
    "Why flexible bodies often need stability and strength before more range",
    "How control and capacity change the way stretching actually feels",
    "A clearer framework for symptom-aware strength work in bendy bodies",
    "Practical ideas you can use without defaulting to more mobility work",
  ],
  title: FREE_GUIDE_TITLE,
} as const;

function includesLegacyLeadMagnetCopy(value?: string) {
  if (!value) return false;

  return (
    value.includes("Why Some Bodies Need Strength Before More Stretching") ||
    value.includes("why-some-bodies-need-strength-before-more-stretching") ||
    value.includes(LEGACY_LEAD_MAGNET.title) ||
    value.includes(LEGACY_LEAD_MAGNET.slug) ||
    value.includes(LEGACY_LEAD_MAGNET.assetUrl)
  );
}

export function normalizeNewsletterSignupContent(
  content: NewsletterSignupContent
): NewsletterSignupContent {
  const shouldReplaceLeadMagnet =
    !content.leadMagnetTitle ||
    !content.leadMagnetSlug ||
    !content.assetUrl ||
    includesLegacyLeadMagnetCopy(content.leadMagnetTitle) ||
    includesLegacyLeadMagnetCopy(content.leadMagnetSlug) ||
    includesLegacyLeadMagnetCopy(content.assetUrl) ||
    includesLegacyLeadMagnetCopy(content.hookText) ||
    includesLegacyLeadMagnetCopy(content.popupTitle) ||
    includesLegacyLeadMagnetCopy(content.popupDescription) ||
    includesLegacyLeadMagnetCopy(content.emailSubject) ||
    includesLegacyLeadMagnetCopy(content.emailBody);

  if (!shouldReplaceLeadMagnet) {
    return content;
  }

  return {
    ...content,
    assetUrl: CANONICAL_LEAD_MAGNET.assetUrl,
    emailBody: CANONICAL_LEAD_MAGNET.emailBody,
    emailPreviewText: content.emailPreviewText || CANONICAL_LEAD_MAGNET.emailPreviewText,
    emailSubject: CANONICAL_LEAD_MAGNET.emailSubject,
    hookText: CANONICAL_LEAD_MAGNET.hookText,
    leadMagnetSlug: CANONICAL_LEAD_MAGNET.slug,
    leadMagnetTitle: CANONICAL_LEAD_MAGNET.title,
    popupDescription: NEWSLETTER_BODY,
    popupTitle: NEWSLETTER_HEADLINE,
    buttonLabel: NEWSLETTER_BUTTON,
  };
}
