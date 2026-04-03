import { render } from "@react-email/render";
import { ServerClient } from "postmark";

const FALLBACK_FROM = "Shruti Turner <shruti@thechronicyogini.com>";
type EmailCategory = "marketing" | "transactional";

export function getPostmarkClient() {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    throw new Error("POSTMARK_NOT_CONFIGURED");
  }
  return new ServerClient(token);
}

export function getPostmarkFromEmail() {
  return process.env.POSTMARK_FROM_EMAIL || FALLBACK_FROM;
}

export function getPostmarkMessageStream(category: EmailCategory = "transactional") {
  if (category === "marketing") {
    return (
      process.env.POSTMARK_MARKETING_MESSAGE_STREAM ||
      process.env.POSTMARK_MESSAGE_STREAM ||
      "outbound"
    );
  }

  return (
    process.env.POSTMARK_TRANSACTIONAL_MESSAGE_STREAM ||
    process.env.POSTMARK_MESSAGE_STREAM ||
    "outbound"
  );
}

export function extractPrimaryEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] || value).trim();
}

export function getNotificationInbox(envName: string) {
  const configured = process.env[envName];
  if (configured?.trim()) return configured.trim();
  return extractPrimaryEmailAddress(getPostmarkFromEmail());
}

export async function sendPostmarkReactEmail(input: {
  to: string;
  subject: string;
  react: React.ReactElement;
  textBody: string;
  tag: string;
  category?: EmailCategory;
  replyTo?: string;
  messageStream?: string;
  metadata?: Record<string, string>;
  attachments?: Array<{
    name: string;
    content: string;
    contentType: string;
  }>;
}) {
  const client = getPostmarkClient();
  const html = await render(input.react);
  const category = input.category || "transactional";
  await client.sendEmail({
    From: getPostmarkFromEmail(),
    To: input.to,
    Subject: input.subject,
    HtmlBody: html,
    TextBody: input.textBody,
    Tag: input.tag,
    ReplyTo: input.replyTo,
    MessageStream: input.messageStream || getPostmarkMessageStream(category),
    Metadata: {
      emailCategory: category,
      ...input.metadata,
    },
    Attachments: input.attachments?.map((attachment) => ({
      Name: attachment.name,
      Content: attachment.content,
      ContentType: attachment.contentType,
      ContentID: attachment.name,
    })),
  });
}
