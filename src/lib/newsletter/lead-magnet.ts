import type { NewsletterSignupContent } from "@/lib/content/types";

const LEGACY_LEAD_MAGNET = {
  assetUrl: "https://shrutiturner.co.uk/resources/5-yoga-poses-strength",
  hookText: 'Get "5 Yoga Poses That Actually Build Strength":',
  slug: "5-yoga-poses-strength",
  title: "5 Yoga Poses That Actually Build Strength",
};

export const FREE_GUIDE_TITLE = "Why Some Bodies Need Strength Before More Stretching";
export const FREE_GUIDE_SUPPORTING_LINE =
  "A free guide exploring stability, control and capacity in flexible bodies.";
export const FREE_GUIDE_META_DESCRIPTION =
  "Join Shruti Turner's newsletter for practical notes on movement, strength and wellbeing, plus the free guide Why Some Bodies Need Strength Before More Stretching.";
export const FREE_GUIDE_KEY = "why-some-bodies-need-strength-before-more-stretching";
export const FREE_GUIDE_POSTMARK_TAG = `lead-magnet-${FREE_GUIDE_KEY}`;
export const FREE_GUIDE_DOWNLOAD_PATH =
  "/guides/why-some-bodies-need-strength-before-more-stretching.pdf";

export const CANONICAL_LEAD_MAGNET = {
  assetUrl: `https://shrutiturner.co.uk${FREE_GUIDE_DOWNLOAD_PATH}`,
  cardDescription: FREE_GUIDE_SUPPORTING_LINE,
  cardTitle: FREE_GUIDE_TITLE,
  emailBody: `Hi {{firstName}},\n\nThanks for joining. Here is your guide: ${FREE_GUIDE_TITLE}.\n\n{{leadMagnetLink}}\n\nShruti`,
  emailPreviewText: "Confirm your email to receive the guide.",
  emailSubject: `Your free guide: ${FREE_GUIDE_TITLE}`,
  hookText: `Join the newsletter and receive the free guide "${FREE_GUIDE_TITLE}"`,
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
    popupDescription:
      !content.popupDescription || includesLegacyLeadMagnetCopy(content.popupDescription)
        ? CANONICAL_LEAD_MAGNET.landingDescription
        : content.popupDescription,
    popupTitle: includesLegacyLeadMagnetCopy(content.popupTitle)
      ? CANONICAL_LEAD_MAGNET.title
      : content.popupTitle,
  };
}
