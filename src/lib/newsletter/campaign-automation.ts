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
type ExistingCampaign = {
  id: string;
  status: string;
};
type CampaignRecipient = {
  subscriberId: string;
  userId: string | null;
  email: string;
  firstName: string;
};

const POSTMARK_FROM_EMAIL =
  process.env.POSTMARK_FROM_EMAIL || "Shruti Turner <shruti@shrutiturner.co.uk>";
const POSTMARK_STREAM = getPostmarkMessageStream("marketing");
const AUTO_SKIP_CAMPAIGN_STATUSES = new Set([
  "sending",
  "scheduled",
  "sent",
  "failed",
  "failed_partial",
]);

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

function readLocalizedValue(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if (typeof record.nodeType === "string" || "url" in record) return value;
  return Object.values(record).find((item) => item !== undefined && item !== null) ?? value;
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

function hasRichTextContent(value: unknown) {
  const localized = readLocalizedValue(value);
  if (!localized || typeof localized !== "object" || Array.isArray(localized)) return false;
  const record = localized as Record<string, unknown>;
  return (
    record.nodeType === "document" && Array.isArray(record.content) && record.content.length > 0
  );
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

function getAlreadyProcessedReason(status: string) {
  if (status === "sent") return "already_sent";
  if (status === "scheduled") return "already_scheduled";
  if (status === "sending") return "already_sending";
  if (status === "failed_partial") return "already_partially_sent";
  if (status === "failed") return "already_failed";
  return "already_processed";
}

function getPublishReadiness(input: {
  contentType: SupportedContentType;
  fields: Record<string, unknown>;
}) {
  if (input.contentType === "newsletterTemplate") {
    if (
      !readStringField(input.fields, "subject") ||
      (!hasRichTextContent(input.fields.content) &&
        !readTextField(input.fields, "content") &&
        !readStringField(input.fields, "body"))
    ) {
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
    include: 3,
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
  const file = readLocalizedValue(fields?.file);
  if (!file || typeof file !== "object" || Array.isArray(file)) return "";
  const url = (file as { url?: unknown }).url;
  if (typeof url !== "string" || !url.trim()) return "";
  return url.startsWith("//") ? `https:${url}` : url.trim();
}

function readAssetAlt(fields: Record<string, unknown> | undefined) {
  const title = readLocalizedValue(fields?.title);
  return typeof title === "string" && title.trim() ? title.trim() : "Newsletter image";
}

function renderNewsletterRichTextNode(
  node: unknown,
  assets: Map<string, { url: string; alt: string }>
): string {
  if (!node || typeof node !== "object" || Array.isArray(node)) return "";
  const record = node as Record<string, unknown>;
  const nodeType = typeof record.nodeType === "string" ? record.nodeType : "";

  if (nodeType === "text") {
    let value = typeof record.value === "string" ? record.value : "";
    const marks = Array.isArray(record.marks) ? record.marks : [];
    for (const mark of marks) {
      const type =
        mark && typeof mark === "object" && "type" in mark
          ? (mark as { type?: unknown }).type
          : undefined;
      if (type === "bold") value = `**${value}**`;
      if (type === "italic") value = `_${value}_`;
      if (type === "code") value = `\`${value}\``;
    }
    return value;
  }

  if (nodeType === "embedded-asset-block") {
    const target =
      record.data && typeof record.data === "object"
        ? (record.data as Record<string, unknown>).target
        : undefined;
    const assetId = getLinkedId(target);
    const targetFields =
      target && typeof target === "object" && !Array.isArray(target) && "fields" in target
        ? (target as { fields?: Record<string, unknown> }).fields
        : undefined;
    const directUrl = readAssetUrl(targetFields);
    const asset =
      assets.get(assetId) ||
      (directUrl ? { url: directUrl, alt: readAssetAlt(targetFields) } : undefined);
    return asset ? `\n\n![${asset.alt.replaceAll("]", "")}](${asset.url})\n\n` : "";
  }

  const children = Array.isArray(record.content)
    ? record.content.map((child) => renderNewsletterRichTextNode(child, assets)).join("")
    : "";

  if (nodeType === "paragraph") return `${children.trim()}\n\n`;
  if (nodeType === "heading-1") return `# ${children.trim()}\n\n`;
  if (nodeType === "heading-2") return `## ${children.trim()}\n\n`;
  if (nodeType === "heading-3") return `### ${children.trim()}\n\n`;
  if (nodeType === "heading-4") return `#### ${children.trim()}\n\n`;
  if (nodeType === "blockquote") return `> ${children.trim().replace(/\n/g, "\n> ")}\n\n`;
  if (nodeType === "hr") return "---\n\n";
  if (nodeType === "list-item") return children.trim();
  if (nodeType === "unordered-list") {
    return `${(record.content as unknown[])
      .map((child) => `- ${renderNewsletterRichTextNode(child, assets).trim()}`)
      .join("\n")}\n\n`;
  }
  if (nodeType === "ordered-list") {
    return `${(record.content as unknown[])
      .map((child, index) => `${index + 1}. ${renderNewsletterRichTextNode(child, assets).trim()}`)
      .join("\n")}\n\n`;
  }
  if (nodeType === "hyperlink") {
    const data =
      record.data && typeof record.data === "object"
        ? (record.data as Record<string, unknown>)
        : {};
    const uri = typeof data.uri === "string" ? data.uri.trim() : "";
    return /^https?:\/\//i.test(uri) ? `[${children.trim()}](${uri})` : children;
  }
  return children;
}

function readNewsletterBody(entry: NonNullable<CampaignEntry>) {
  const assets = new Map<string, { url: string; alt: string }>();
  for (const asset of entry.includes?.Asset || []) {
    const url = readAssetUrl(asset.fields);
    if (url) assets.set(asset.sys.id, { url, alt: readAssetAlt(asset.fields) });
  }

  const content = readLocalizedValue(entry.fields.content);
  if (content && typeof content === "object" && !Array.isArray(content)) {
    const rendered = renderNewsletterRichTextNode(content, assets)
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (rendered) return rendered;
  }

  return readTextField(entry.fields, "body");
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
    const blogUrl = `${getBaseSiteUrlFromEnv()}/blog`;
    return {
      subject,
      html,
      text: [
        `Hi ${firstName},`,
        "",
        "I've just published a new post on my blog I thought you'd be interested in.",
        "",
        postTitle,
        "",
        postExcerpt,
        "",
        postUrl || blogUrl,
        "",
        "If something resonated with you, feel free to reply to this email. I always love hearing from you.",
        "",
        `You can also browse all articles on the blog: ${blogUrl}`,
        "",
        "Hope you enjoy,",
        "Shruti",
        "",
        `Unsubscribe: ${unsubscribeUrl}`,
      ].join("\n"),
    };
  }

  const subject =
    readStringField(fields, "subject") || readStringField(fields, "title") || "Newsletter";
  const previewText = readStringField(fields, "previewText") || undefined;
  const body = readNewsletterBody(entry).replace(/\{\{\s*firstName\s*\}\}/gi, firstName);
  const html = await render(
    NewsletterEmail({
      firstName,
      subject,
      previewText,
      bodyContent: body,
      unsubscribeUrl,
    })
  );
  return {
    subject,
    html,
    text: `${previewText ? `${previewText}\n\n` : ""}${body || subject}\n\nUnsubscribe: ${unsubscribeUrl}`,
  };
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

  const existingByProviderId = await db.emailCampaign.findUnique({
    where: { providerCampaignId },
    select: { id: true, status: true },
  });
  const existing: ExistingCampaign | null =
    existingByProviderId ||
    (contentType === "blogPost"
      ? await db.emailCampaign.findFirst({
          where: {
            contentfulEntryId: input.contentfulEntryId,
            contentfulContentType: contentType,
            audienceType,
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true },
        })
      : null);

  if (existing && AUTO_SKIP_CAMPAIGN_STATUSES.has(existing.status)) {
    return {
      skipped: true as const,
      reason: getAlreadyProcessedReason(existing.status),
      campaignId: existing.id,
    };
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
