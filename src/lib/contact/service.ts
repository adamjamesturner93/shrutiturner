import { db } from "@/lib/db";
import { getNotificationInbox, sendPostmarkReactEmail } from "@/lib/postmark/client";
import ContactConfirmationEmail from "@/emails/contact-confirmation";
import ContactNotificationEmail from "@/emails/contact-notification";

const DEFAULT_CONTACT_CONSENT_WORDING =
  "I consent to Shruti Turner using the information in this form to respond to my enquiry. I understand this may include health or accessibility context I choose to share.";

export type ContactSubmissionInput = {
  userId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  topic: string;
  conditions?: string;
  howFound?: string;
  message: string;
  contactConsent: boolean;
  contactConsentText?: string;
};

function normalizeText(value: string, max: number) {
  return value.trim().slice(0, max);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function submitContactForm(input: ContactSubmissionInput) {
  const firstName = normalizeText(input.firstName, 80);
  const lastName = normalizeText(input.lastName, 80);
  const email = normalizeEmail(input.email);
  const topic = normalizeText(input.topic, 120);
  const message = input.message.trim();
  const consentText =
    normalizeText(input.contactConsentText || DEFAULT_CONTACT_CONSENT_WORDING, 500) ||
    DEFAULT_CONTACT_CONSENT_WORDING;
  const consentedAt = new Date();

  if (!firstName || !lastName) throw new Error("NAME_REQUIRED");
  if (!email || !email.includes("@")) throw new Error("EMAIL_REQUIRED");
  if (!topic) throw new Error("TOPIC_REQUIRED");
  if (message.length < 10) throw new Error("MESSAGE_TOO_SHORT");
  if (!input.contactConsent) throw new Error("CONSENT_REQUIRED");

  const submission = await db.contactSubmission.create({
    data: {
      userId: input.userId || undefined,
      firstName,
      lastName,
      email,
      topic,
      conditions: normalizeText(input.conditions || "", 240) || null,
      howFound: normalizeText(input.howFound || "", 120) || null,
      message,
    },
  });

  await sendPostmarkReactEmail({
    to: getNotificationInbox("CONTACT_NOTIFICATION_EMAIL"),
    subject: `New contact enquiry: ${topic}`,
    react: ContactNotificationEmail({
      name: `${firstName} ${lastName}`.trim(),
      email,
      topic,
      message,
      conditions: submission.conditions || undefined,
      howFound: submission.howFound || undefined,
      consentText,
      consentedAt: consentedAt.toISOString(),
    }),
    textBody: `New contact enquiry from ${firstName} ${lastName}\nEmail: ${email}\nTopic: ${topic}\n${submission.conditions ? `Conditions: ${submission.conditions}\n` : ""}${submission.howFound ? `How found: ${submission.howFound}\n` : ""}Consent: ${consentText}\nConsented at: ${consentedAt.toISOString()}\n\n${message}`,
    tag: "contact-submission",
    templateKey: "contact-submission",
    replyTo: email,
    metadata: {
      submissionId: submission.id,
      topic,
      contactConsent: "true",
      consentedAt: consentedAt.toISOString(),
    },
    dispatchMode: "immediate_best_effort",
  });

  await sendPostmarkReactEmail({
    to: email,
    subject: "We received your enquiry",
    react: ContactConfirmationEmail({
      firstName,
      topic,
    }),
    textBody: `Hi ${firstName},\n\nThanks for getting in touch. Your enquiry about ${topic} has been received and will be read personally.\n\nYou will usually hear back within 2 working days.\n\nThis confirmation is only about your enquiry. You have not been added to the newsletter.`,
    tag: "contact-confirmation",
    templateKey: "contact-confirmation",
    metadata: {
      submissionId: submission.id,
      topic,
    },
    dispatchMode: "immediate_best_effort",
  });

  return submission;
}
