import { render } from "@react-email/render";
import { EmailDeliveryAttemptStatus, EmailDeliveryStatus, type Prisma } from "@prisma/client";
import { ServerClient } from "postmark";
import BlogPostEmail from "@/emails/blog-post";
import NewsletterEmail from "@/emails/newsletter";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { db } from "@/lib/db";
import { getEntries } from "@/lib/content/contentful-client";
import { getBaseSiteUrlFromEnv, getPostmarkToken } from "@/lib/env";
import { getPostmarkMessageStream } from "@/lib/postmark/client";
import { createSignedUnsubscribeToken } from "@/lib/newsletter/tokens";

type CampaignAudienceType = "newsletter" | "blog";
type SupportedContentType = "blogPost" | "newsletterTemplate";
type SendEmailBatchResponse = Awaited<ReturnType<ServerClient["sendEmailBatch"]>>;
type CampaignEntry = Awaited<ReturnType<typeof loadEntry>>;
type CampaignRecipient = {
  subscriberId: string;
  userId: string | null;
  email: string;
  firstName: string;
};

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

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function readStringField(fields: Record<string, unknown>, key: string) {
  const value = fields[key];
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const localized = Object.values(value).find((item) => typeof item === "string" && item.trim());
    return typeof localized === "string" ? localized.trim() : "";
  }
  return "";
}

function stringifyContentValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => stringifyContentValue(item)).join(" ");
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.value === "string") return record.value;
    if (typeof record.nodeType === "string" && Array.isArray(record.content)) {
      return record.content.map((item) => stringifyContentValue(item)).join(" ");
    }
    return Object.values(record)
      .map((item) => stringifyContentValue(item))
      .join(" ");
  }
  return "";
}

function readTextField(fields: Record<string, unknown>, key: string) {
  const value = fields[key];
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (typeof record.nodeType === "string" && Array.isArray(record.content)) {
      return stringifyContentValue(value).trim();
    }
    const localized = Object.values(value).find((item) => stringifyContentValue(item).trim());
    return localized
      ? stringifyContentValue(localized).trim()
      : stringifyContentValue(value).trim();
  }
  return stringifyContentValue(value).trim();
}

function stripMarkup(input: string) {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_>`~[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateWords(input: string, maxWords: number) {
  const words = stripMarkup(input).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function getEntrySubject(contentType: SupportedContentType, fields: Record<string, unknown>) {
  const subject = readStringField(fields, "subject");
  if (subject) return subject;
  const title = readStringField(fields, "title");
  if (title) return contentType === "blogPost" ? `New blog post: ${title}` : title;
  return contentType === "blogPost" ? "Blog campaign" : "Newsletter campaign";
}

function getPublishReadiness(input: {
  contentType: SupportedContentType;
  fields: Record<string, unknown>;
}) {
  if (input.contentType === "newsletterTemplate") {
    if (!readStringField(input.fields, "subject") || !readStringField(input.fields, "body")) {
      return { ready: false as const, reason: "missing_required_fields" };
    }
  }

  if (input.contentType === "blogPost") {
    if (!readStringField(input.fields, "title") || !readStringField(input.fields, "slug")) {
      return { ready: false as const, reason: "missing_required_fields" };
    }
  }

  return { ready: true as const };
}

async function loadEntry(contentType: SupportedContentType, entryId: string) {
  const res = await getEntries<Record<string, unknown>>(contentType, {
    "sys.id": entryId,
    limit: 1,
    include: 2,
  });
  const entry = res?.items?.[0];
  return entry ? { ...entry, includes: res?.includes } : null;
}

async function getAudienceEmails() {
  const subscribers = await db.newsletterSubscriber.findMany({
    where: {
      status: "subscribed",
      OR: [
        { user: null },
        { user: { notificationPreference: { is: null } } },
        { user: { notificationPreference: { is: { marketingEmails: true } } } },
      ],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      userId: true,
      user: {
        select: {
          firstName: true,
        },
      },
    },
  });

  const deduped = new Map<string, CampaignRecipient>();
  for (const subscriber of subscribers) {
    const email = subscriber.email.trim().toLowerCase();
    if (!email) continue;
    if (!deduped.has(email)) {
      deduped.set(email, {
        subscriberId: subscriber.id,
        userId: subscriber.userId,
        email,
        firstName: subscriber.firstName || subscriber.user?.firstName || "there",
      });
    }
  }
  return Array.from(deduped.values());
}

function getLinkedId(value: unknown) {
  if (!value || typeof value !== "object" || !("sys" in value)) return "";
  const id = (value as { sys?: { id?: unknown } }).sys?.id;
  return typeof id === "string" ? id : "";
}

function readAssetUrl(fields: Record<string, unknown> | undefined) {
  const file = fields?.file;
  if (!file || typeof file !== "object" || Array.isArray(file)) return "";
  const url = (file as { url?: unknown }).url;
  if (typeof url !== "string" || !url.trim()) return "";
  return url.startsWith("//") ? `https:${url}` : url.trim();
}

function readBlogCoverImageUrl(entry: NonNullable<CampaignEntry>) {
  const directUrl = readStringField(entry.fields, "coverImageUrl");
  if (directUrl) return directUrl;

  const assetId = getLinkedId(entry.fields.coverImageAsset);
  const asset = entry.includes?.Asset?.find((item) => item.sys.id === assetId);
  return readAssetUrl(asset?.fields);
}

async function renderCampaignMessage(
  contentType: SupportedContentType,
  entry: NonNullable<CampaignEntry>,
  firstName: string,
  unsubscribeUrl: string
) {
  const fields = entry.fields;
  if (contentType === "blogPost") {
    const postTitle = readStringField(fields, "title") || "New blog post";
    const postExcerpt = truncateWords(
      readTextField(fields, "excerpt") || readTextField(fields, "content") || postTitle,
      100
    );
    const slug = readStringField(fields, "slug");
    const postImageUrl = readBlogCoverImageUrl(entry) || undefined;
    const tags = Array.isArray(fields.tags)
      ? fields.tags.filter((x): x is string => typeof x === "string")
      : [];
    const postUrl = slug ? `${getBaseSiteUrlFromEnv()}/blog/${slug}` : undefined;
    const html = await render(
      BlogPostEmail({
        firstName,
        postTitle,
        postExcerpt,
        postImageUrl,
        postUrl,
        tags,
        unsubscribeUrl,
      })
    );
    const subject = `New blog post: ${postTitle}`;
    return {
      subject,
      html,
      text: `${subject}\n\n${postExcerpt}\n\n${postUrl || getBaseSiteUrlFromEnv()}/blog\n\nUnsubscribe: ${unsubscribeUrl}`,
    };
  }

  const subject =
    readStringField(fields, "subject") || readStringField(fields, "title") || "Newsletter";
  const body = readTextField(fields, "body").replace(/\{\{\s*firstName\s*\}\}/gi, firstName);
  const html = await render(
    NewsletterEmail({
      firstName,
      subject,
      bodyContent: body,
      unsubscribeUrl,
    })
  );
  return { subject, html, text: `${body || subject}\n\nUnsubscribe: ${unsubscribeUrl}` };
}

async function createCampaignDelivery(input: {
  recipient: CampaignRecipient;
  campaignId: string;
  contentType: SupportedContentType;
  subject: string;
  htmlBody: string;
  textBody: string;
  tag: string;
  metadata: Record<string, string>;
}) {
  return db.emailDelivery.create({
    data: {
      toEmail: input.recipient.email,
      userId: input.recipient.userId || undefined,
      campaignId: input.campaignId,
      templateKey: `contentful-${input.contentType}`,
      category: "marketing",
      provider: "postmark",
      subject: input.subject,
      tag: input.tag,
      messageStream: POSTMARK_STREAM,
      status: EmailDeliveryStatus.sending,
      retryable: true,
      attemptCount: 1,
      maxAttempts: 3,
      payloadJson: toJsonValue({
        htmlBody: input.htmlBody,
        textBody: input.textBody,
      }),
      metadataJson: toJsonValue(input.metadata),
    },
    select: {
      id: true,
    },
  });
}

async function recordCampaignDeliveryResult(input: {
  deliveryId: string;
  attemptNumber: number;
  item: {
    ErrorCode?: number;
    Message?: string;
    MessageID?: string;
  };
}) {
  const failed = Boolean(input.item.ErrorCode && input.item.ErrorCode !== 0);
  const now = new Date();

  await db.emailDelivery.update({
    where: { id: input.deliveryId },
    data: {
      status: failed ? EmailDeliveryStatus.failed : EmailDeliveryStatus.sent,
      providerMessageId: input.item.MessageID || undefined,
      lastError: failed ? input.item.Message || "Postmark campaign send failed" : null,
      sentAt: failed ? undefined : now,
    },
  });

  await db.emailDeliveryAttempt.create({
    data: {
      deliveryId: input.deliveryId,
      attemptNumber: input.attemptNumber,
      status: failed ? EmailDeliveryAttemptStatus.failed : EmailDeliveryAttemptStatus.sent,
      providerMessageId: input.item.MessageID || undefined,
      errorMessage: failed ? input.item.Message || "Postmark campaign send failed" : null,
      responseJson: toJsonValue(input.item),
      finishedAt: now,
    },
  });
}

async function runCampaign(params: {
  campaignId: string;
  contentType: SupportedContentType;
  contentfulEntryId: string;
  audienceType: CampaignAudienceType;
  entry?: NonNullable<CampaignEntry>;
}) {
  const postmarkToken = getPostmarkToken();
  if (!postmarkToken) {
    throw new Error("POSTMARK_NOT_CONFIGURED");
  }

  const entry = params.entry || (await loadEntry(params.contentType, params.contentfulEntryId));
  if (!entry) {
    throw new Error("CONTENTFUL_ENTRY_NOT_FOUND");
  }

  const audience = await getAudienceEmails();
  const client = new ServerClient(postmarkToken);

  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const batch of chunk(audience, 300)) {
    const messages = await Promise.all(
      batch.map(async (recipient) => {
        const unsubscribeUrl = `${getBaseSiteUrlFromEnv()}/unsubscribe?token=${encodeURIComponent(
          createSignedUnsubscribeToken(recipient.subscriberId)
        )}`;
        const rendered = await renderCampaignMessage(
          params.contentType,
          entry,
          recipient.firstName,
          unsubscribeUrl
        );
        const tag = `contentful-${params.contentType}`;
        const metadata: Record<string, string> = {
          emailCategory: "marketing",
          campaignId: params.campaignId,
          contentfulEntryId: params.contentfulEntryId,
          audienceType: params.audienceType,
          source: "contentful_publish",
          subscriberId: recipient.subscriberId,
        };
        const delivery = await createCampaignDelivery({
          recipient,
          campaignId: params.campaignId,
          contentType: params.contentType,
          subject: rendered.subject,
          htmlBody: rendered.html,
          textBody: rendered.text,
          tag,
          metadata,
        });
        return {
          deliveryId: delivery.id,
          message: {
            From: POSTMARK_FROM_EMAIL,
            To: recipient.email,
            Subject: rendered.subject,
            HtmlBody: rendered.html,
            TextBody: rendered.text,
            MessageStream: POSTMARK_STREAM,
            Tag: tag,
            Metadata: {
              ...metadata,
              deliveryId: delivery.id,
            },
          },
        };
      })
    );

    const response = (await client.sendEmailBatch(
      messages.map((item) => item.message)
    )) as SendEmailBatchResponse;
    const items = response as Array<{
      ErrorCode?: number;
      Message?: string;
      MessageID?: string;
    }>;

    for (const [index, item] of items.entries()) {
      const delivery = messages[index];
      if (delivery) {
        await recordCampaignDeliveryResult({
          deliveryId: delivery.deliveryId,
          attemptNumber: 1,
          item,
        });
      }

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
  now?: Date;
}) {
  if (input.contentType !== "blogPost" && input.contentType !== "newsletterTemplate") {
    return { skipped: true as const, reason: "unsupported_content_type" };
  }

  const contentType = input.contentType as SupportedContentType;
  const entry = await loadEntry(contentType, input.contentfulEntryId);
  if (!entry) {
    throw new Error("CONTENTFUL_ENTRY_NOT_FOUND");
  }

  const readiness = getPublishReadiness({
    contentType,
    fields: entry.fields,
  });
  const audienceType = mapAudience(contentType);
  const providerCampaignId =
    contentType === "blogPost"
      ? `contentful:${contentType}:${input.contentfulEntryId}:${audienceType}`
      : `contentful:${contentType}:${input.contentfulEntryId}:${input.contentfulVersion || "latest"}:${audienceType}`;

  const existing = await db.emailCampaign.findUnique({
    where: { providerCampaignId },
    select: { id: true, status: true },
  });

  if (existing?.status === "sent") {
    return { skipped: true as const, reason: "already_sent", campaignId: existing.id };
  }

  if (!readiness.ready) {
    return { skipped: true as const, reason: readiness.reason };
  }

  const campaign = existing
    ? await db.emailCampaign.update({
        where: { id: existing.id },
        data: {
          subject: getEntrySubject(contentType, entry.fields),
          status: "sending",
          scheduledAt: null,
          errorSummary: null,
        },
      })
    : await db.emailCampaign.create({
        data: {
          providerCampaignId,
          subject: getEntrySubject(contentType, entry.fields),
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
      entry,
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

export async function retryContentfulCampaign(input: {
  campaignId: string;
  actorUserId?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  const campaign = await db.emailCampaign.findUnique({
    where: { id: input.campaignId },
    select: {
      id: true,
      status: true,
      sentCount: true,
      failedCount: true,
      errorSummary: true,
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

  const result = { ok: true, campaignId: campaign.id };

  if (input.actorUserId) {
    await createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "newsletter_campaign_retried",
      targetType: "email_campaign",
      targetId: campaign.id,
      requestId: input.requestId,
      requestPath: input.requestPath,
      requestIp: input.requestIp,
      oldValueJson: {
        status: campaign.status,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        errorSummary: campaign.errorSummary,
      },
      newValueJson: result,
    });
  }

  return result;
}

export async function processDueContentfulCampaigns(now = new Date(), limit = 25) {
  const campaigns = await db.emailCampaign.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: now },
      contentfulEntryId: { not: null },
      contentfulContentType: { in: ["blogPost", "newsletterTemplate"] },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
    select: {
      id: true,
      contentfulEntryId: true,
      contentfulContentType: true,
      audienceType: true,
    },
  });

  let processed = 0;
  let failed = 0;

  for (const campaign of campaigns) {
    if (!campaign.contentfulEntryId || !campaign.contentfulContentType) continue;
    try {
      await db.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: "sending", errorSummary: null },
      });
      await runCampaign({
        campaignId: campaign.id,
        contentType: campaign.contentfulContentType as SupportedContentType,
        contentfulEntryId: campaign.contentfulEntryId,
        audienceType: (campaign.audienceType as CampaignAudienceType) || "newsletter",
      });
      processed += 1;
    } catch (error) {
      failed += 1;
      await db.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          status: "failed",
          errorSummary:
            error instanceof Error ? error.message : "Failed to send scheduled campaign",
        },
      });
    }
  }

  return {
    ok: failed === 0,
    scanned: campaigns.length,
    processed,
    failed,
  };
}
