import NewsletterVerificationEmail from "@/emails/newsletter-verification";
import WelcomeEmail from "@/emails/welcome";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { getNewsletterSignupContent } from "@/lib/content";
import { CANONICAL_LEAD_MAGNET } from "@/lib/newsletter/lead-magnet";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";
import { createSignedUnsubscribeToken } from "@/lib/newsletter/tokens";

function buildPrivacyUrl() {
  return buildAbsoluteUrl("/privacy");
}

function buildUnsubscribeUrl(subscriberId: string) {
  return buildAbsoluteUrl(
    `/unsubscribe?token=${encodeURIComponent(createSignedUnsubscribeToken(subscriberId))}`
  );
}

export async function sendNewsletterVerificationEmail(input: {
  email: string;
  firstName?: string | null;
  source: string;
  subscriberId: string;
  verificationToken: string;
}) {
  const signupContent = await getNewsletterSignupContent();
  const privacyUrl = buildPrivacyUrl();
  const verificationUrl = buildAbsoluteUrl(
    `/api/newsletter/verify?token=${encodeURIComponent(input.verificationToken)}`
  );
  const unsubscribeUrl = buildUnsubscribeUrl(input.subscriberId);
  const leadMagnetTitle = signupContent.leadMagnetTitle || CANONICAL_LEAD_MAGNET.title;

  await sendPostmarkReactEmail({
    to: input.email,
    subject: "Confirm your email to get launch updates",
    react: (
      <NewsletterVerificationEmail
        firstName={input.firstName || "there"}
        leadMagnetTitle={leadMagnetTitle}
        privacyUrl={privacyUrl}
        unsubscribeUrl={unsubscribeUrl}
        verificationUrl={verificationUrl}
      />
    ),
    textBody: [
      `Hi ${input.firstName || "there"},`,
      "",
      `Confirm your email to receive launch updates and your free guide, ${leadMagnetTitle}:`,
      verificationUrl,
      "",
      "This link expires in 24 hours.",
      `Privacy policy: ${privacyUrl}`,
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join("\n"),
    tag: "newsletter-verification",
    templateKey: "newsletter-verification",
    category: "transactional",
    metadata: {
      source: input.source,
      subscriberId: input.subscriberId,
    },
    retryable: false,
    maxAttempts: 1,
    dispatchMode: "immediate_required",
  });
}

export async function sendLeadMagnetDeliveryEmail(input: {
  email: string;
  firstName?: string | null;
  subscriberId: string;
}) {
  const signupContent = await getNewsletterSignupContent();
  const privacyUrl = buildPrivacyUrl();
  const unsubscribeUrl = buildUnsubscribeUrl(input.subscriberId);
  const downloadUrl = signupContent.assetUrl || CANONICAL_LEAD_MAGNET.assetUrl;

  await sendPostmarkReactEmail({
    to: input.email,
    subject: signupContent.leadMagnetTitle
      ? `${signupContent.leadMagnetTitle} is ready`
      : "Your free guide is ready",
    react: (
      <WelcomeEmail
        firstName={input.firstName || "there"}
        leadMagnetTitle={signupContent.leadMagnetTitle || "Your free guide"}
        leadMagnetDescription={
          signupContent.popupDescription ||
          "Thanks for confirming your email. Your free guide is ready below."
        }
        downloadUrl={downloadUrl}
        ctaLabel="Download your guide"
        welcomeCopy={
          "Thanks for confirming your email.\n\nYour free guide is ready below and future updates will only arrive when there is something genuinely useful to share."
        }
        classesUrl={buildAbsoluteUrl("/classes")}
        aboutUrl={buildAbsoluteUrl("/about")}
        privacyUrl={privacyUrl}
        unsubscribeUrl={unsubscribeUrl}
      />
    ),
    textBody: [
      `Hi ${input.firstName || "there"},`,
      "",
      "Thanks for confirming your email. Your free guide is ready here:",
      downloadUrl,
      "",
      `Privacy policy: ${privacyUrl}`,
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join("\n"),
    tag: "newsletter-lead-magnet",
    templateKey: "newsletter-lead-magnet",
    category: "marketing",
    metadata: {
      subscriberId: input.subscriberId,
    },
    retryable: true,
    maxAttempts: 5,
    dispatchMode: "immediate_best_effort",
  });
}

export { buildUnsubscribeUrl };
