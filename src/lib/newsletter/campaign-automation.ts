import { render } from "@react-email/render";
import { UserRole } from "@prisma/client";
import { ServerClient } from "postmark";
import BlogPostEmail from "@/emails/blog-post";
import NewsletterEmail from "@/emails/newsletter";
import { db } from "@/lib/db";
import { getEntries } from "@/lib/content/contentful-client";
import { getPostmarkMessageStream } from "@/lib/postmark/client";

type CampaignAudienceType = "newsletter" | "blog";
type SupportedContentType = "blogPost" | "newsletterTemplate";
type SendEmailBatchResponse = Awaited<ReturnType<ServerClient["sendEmailBatch"]>>;

const POSTMARK_FROM_EMAIL =
  process.env.POSTMARK_FROM_EMAIL || "Shruti Turner <shruti@thechronicyogini.com>";
const POSTMARK_STREAM = getPostmarkMessageStream("marketing");

function chunk<T>(input: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < input.length; i += size) out.push(input.slice(i, i + size));
  return out;
}

function mapAudience(contentType: SupportedContentType): CampaignAudienceType {
  return contentType === "blogPost" ? "blog" : "newsletter";
}

async function loadEntry(contentType: SupportedContentType, entryId: string) {
  const res = await getEntries<Record<string, unknown>>(contentType, {
    "sys.id": entryId,
    limit: 1,
  });
  return res?.items?.[0] || null;
}

async function getAudienceEmails(audienceType: CampaignAudienceType) {
  const users = await db.user.findMany({
    where: {
      role: { in: [UserRole.student, UserRole.member] },
      OR:
        audienceType === "blog"
          ? [
              { notificationPreference: { is: null } },
              { notificationPreference: { is: { marketingEmails: true } } },
            ]
          : [
              { notificationPreference: { is: null } },
              { notificationPreference: { is: { marketingEmails: true } } },
            ],
    },
    select: {
      email: true,
      firstName: true,
    },
  });

  const deduped = new Map<string, { email: string; firstName: string }>();
  for (const user of users) {
    const email = user.email.trim().toLowerCase();
    if (!email) continue;
    if (!deduped.has(email)) {
      deduped.set(email, { email, firstName: user.firstName || "there" });
    }
  }
  return Array.from(deduped.values());
}

async function renderCampaignMessage(
  contentType: SupportedContentType,
  fields: Record<string, unknown>,
  firstName: string
) {
  if (contentType === "blogPost") {
    const postTitle = String(fields.title || "New blog post");
    const postExcerpt = String(fields.excerpt || "");
    const slug = String(fields.slug || "");
    const postImageUrl = fields.coverImage ? String(fields.coverImage) : undefined;
    const tags = Array.isArray(fields.tags)
      ? fields.tags.filter((x): x is string => typeof x === "string")
      : [];
    const postUrl = slug
      ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://shrutiturner.co.uk"}/blog/${slug}`
      : undefined;
    const html = await render(
      BlogPostEmail({
        firstName,
        postTitle,
        postExcerpt,
        postImageUrl,
        postUrl,
        tags,
      })
    );
    const subject = postTitle;
    return { subject, html, text: `${postTitle}\n\n${postExcerpt}` };
  }

  const subject = String(fields.subject || fields.title || "Newsletter");
  const body = String(fields.body || "");
  const html = await render(
    NewsletterEmail({
      firstName,
      subject,
      bodyContent: body,
    })
  );
  return { subject, html, text: body || subject };
}

async function runCampaign(params: {
  campaignId: string;
  contentType: SupportedContentType;
  contentfulEntryId: string;
  audienceType: CampaignAudienceType;
}) {
  const postmarkToken = process.env.POSTMARK_API_TOKEN;
  if (!postmarkToken) {
    throw new Error("POSTMARK_NOT_CONFIGURED");
  }

  const entry = await loadEntry(params.contentType, params.contentfulEntryId);
  if (!entry) {
    throw new Error("CONTENTFUL_ENTRY_NOT_FOUND");
  }

  const audience = await getAudienceEmails(params.audienceType);
  const client = new ServerClient(postmarkToken);

  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const batch of chunk(audience, 300)) {
    const messages = await Promise.all(
      batch.map(async (recipient) => {
        const rendered = await renderCampaignMessage(
          params.contentType,
          entry.fields,
          recipient.firstName
        );
        return {
          From: POSTMARK_FROM_EMAIL,
          To: recipient.email,
          Subject: rendered.subject,
          HtmlBody: rendered.html,
          TextBody: rendered.text,
          MessageStream: POSTMARK_STREAM,
          Tag: `contentful-${params.contentType}`,
          Metadata: {
            emailCategory: "marketing",
            campaignId: params.campaignId,
            contentfulEntryId: params.contentfulEntryId,
            audienceType: params.audienceType,
            source: "contentful_publish",
          },
        };
      })
    );

    const response = (await client.sendEmailBatch(messages)) as SendEmailBatchResponse;
    const items = response as Array<{
      ErrorCode?: number;
      Message?: string;
      MessageID?: string;
    }>;

    for (const item of items) {
      if (item.ErrorCode && item.ErrorCode !== 0) {
        failedCount += 1;
        if (item.Message) errors.push(item.Message);
      } else {
        sentCount += 1;
      }
    }
  }

  await db.emailCampaign.update({
    where: { id: params.campaignId },
    data: {
      status: failedCount > 0 ? "failed_partial" : "sent",
      sentAt: new Date(),
      sentCount,
      failedCount,
      errorSummary: errors.length ? Array.from(new Set(errors)).join(" | ").slice(0, 2000) : null,
    },
  });
}

export async function triggerContentfulPublishCampaign(input: {
  contentType: string;
  contentfulEntryId: string;
  contentfulVersion?: string;
}) {
  if (input.contentType !== "blogPost" && input.contentType !== "newsletterTemplate") {
    return { skipped: true as const, reason: "unsupported_content_type" };
  }

  const contentType = input.contentType as SupportedContentType;
  const audienceType = mapAudience(contentType);
  const providerCampaignId = `contentful:${contentType}:${input.contentfulEntryId}:${input.contentfulVersion || "latest"}:${audienceType}`;

  const existing = await db.emailCampaign.findUnique({
    where: { providerCampaignId },
    select: { id: true, status: true },
  });
  if (existing?.status === "sent") {
    return { skipped: true as const, reason: "already_sent", campaignId: existing.id };
  }

  const campaign = existing
    ? await db.emailCampaign.update({
        where: { id: existing.id },
        data: { status: "sending", errorSummary: null },
      })
    : await db.emailCampaign.create({
        data: {
          providerCampaignId,
          subject: contentType === "blogPost" ? "Blog campaign" : "Newsletter campaign",
          stream: POSTMARK_STREAM,
          status: "sending",
          audienceType,
          triggeredBy: "contentful_publish",
          contentfulEntryId: input.contentfulEntryId,
          contentfulContentType: contentType,
        },
      });

  try {
    await runCampaign({
      campaignId: campaign.id,
      contentType,
      contentfulEntryId: input.contentfulEntryId,
      audienceType,
    });
    return { skipped: false as const, campaignId: campaign.id };
  } catch (error) {
    await db.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "failed",
        errorSummary: error instanceof Error ? error.message : "Failed to send campaign",
      },
    });
    throw error;
  }
}

export async function retryContentfulCampaign(campaignId: string) {
  const campaign = await db.emailCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      contentfulEntryId: true,
      contentfulContentType: true,
      audienceType: true,
    },
  });
  if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");
  if (!campaign.contentfulEntryId || !campaign.contentfulContentType) {
    throw new Error("CAMPAIGN_NOT_RETRYABLE");
  }

  await db.emailCampaign.update({
    where: { id: campaign.id },
    data: { status: "sending", sentCount: 0, failedCount: 0, errorSummary: null },
  });

  await runCampaign({
    campaignId: campaign.id,
    contentType: campaign.contentfulContentType as SupportedContentType,
    contentfulEntryId: campaign.contentfulEntryId,
    audienceType: (campaign.audienceType as CampaignAudienceType) || "newsletter",
  });

  return { ok: true, campaignId: campaign.id };
}
