import { db } from "@/lib/db";
import { getNotificationInbox, sendPostmarkReactEmail } from "@/lib/postmark/client";
import ContactNotificationEmail from "@/emails/contact-notification";

export type ContactSubmissionInput = {
  userId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  topic: string;
  conditions?: string;
  howFound?: string;
  message: string;
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

  if (!firstName || !lastName) throw new Error("NAME_REQUIRED");
  if (!email || !email.includes("@")) throw new Error("EMAIL_REQUIRED");
  if (!topic) throw new Error("TOPIC_REQUIRED");
  if (message.length < 10) throw new Error("MESSAGE_TOO_SHORT");

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
    }),
    textBody: `New contact enquiry from ${firstName} ${lastName}\nEmail: ${email}\nTopic: ${topic}\n${submission.conditions ? `Conditions: ${submission.conditions}\n` : ""}${submission.howFound ? `How found: ${submission.howFound}\n` : ""}\n${message}`,
    tag: "contact-submission",
    templateKey: "contact-submission",
    replyTo: email,
    metadata: {
      submissionId: submission.id,
      topic,
    },
    dispatchMode: "immediate_best_effort",
  });

  return submission;
}
