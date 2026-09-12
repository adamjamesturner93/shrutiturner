import { render } from "@react-email/render";
import { getBlogEmailCopy } from "@/lib/newsletter/blog-email-copy";
import { randomUUID } from "node:crypto";
import { EmailDeliveryAttemptStatus, EmailDeliveryStatus, Prisma } from "@prisma/client";
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
  process.env.POSTMARK_FROM_EMAIL || "Shruti Turner <shruti@shrutiturner.co.uk>";
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
  if (contentType === "blogPost") {
    const publicationSubject = readStringField(fields, "emailSubject");
    if (publicationSubject) return publicationSubject.replace(/[\r\n]+/g, " ");
  }
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
  if (status === "preparing") return "already_preparing";
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
    const { subject, introduction } = getBlogEmailCopy({
      title: postTitle,
      firstName,
      subject: readStringField(fields, "emailSubject"),
      introduction: readTextField(fields, "emailIntroduction"),
    });
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
        introduction,
        postTitle,
        postExcerpt,
        postImageUrl,
        postUrl,
        tags,
        unsubscribeUrl,
      })
    );
    const blogUrl = `${getBaseSiteUrlFromEnv()}/blog`;
    return {
      subject,
      html,
      text: [
        `Hi ${firstName},`,
        "",
        introduction,
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
  const campaignRecipientKey = `${input.campaignId}:${input.recipient.subscriberId}`;
  const payloadJson = toJsonValue({
    htmlBody: input.htmlBody,
    textBody: input.textBody,
  });
  const metadataJson = toJsonValue(input.metadata);
  const delivery = await db.emailDelivery.upsert({
    where: { campaignRecipientKey },
    update: {},
    create: {
      campaignRecipientKey,
      toEmail: input.recipient.email,
      userId: input.recipient.userId || undefined,
      campaignId: input.campaignId,
      templateKey: `contentful-${input.contentType}`,
      category: "marketing",
      provider: "postmark",
      subject: input.subject,
      tag: input.tag,
      messageStream: POSTMARK_STREAM,
      status: EmailDeliveryStatus.queued,
      retryable: true,
      attemptCount: 0,
      maxAttempts: 3,
      payloadJson,
      metadataJson,
    },
    select: { id: true },
  });
  return {
    id: delivery.id,
    toEmail: input.recipient.email,
    subject: input.subject,
    tag: input.tag,
    messageStream: POSTMARK_STREAM,
    payloadJson,
    metadataJson,
    attemptCount: 0,
    payload: { htmlBody: input.htmlBody, textBody: input.textBody },
  } satisfies PreparedCampaignDelivery;
}

async function recordCampaignDeliveryResult(input: {
  deliveryId: string;
  attemptId: string;
  attemptNumber: number;
  item: {
    ErrorCode?: number;
    Message?: string;
    MessageID?: string;
  };
}) {
  const failed = Boolean(input.item.ErrorCode && input.item.ErrorCode !== 0);
  if (!failed && !input.item.MessageID) throw new Error("CAMPAIGN_PROVIDER_OUTCOME_UNKNOWN");
  const now = new Date();

  await db.$transaction([
    db.emailDelivery.update({
      where: { id: input.deliveryId },
      data: {
        status: failed ? EmailDeliveryStatus.failed : EmailDeliveryStatus.sent,
        attemptCount: input.attemptNumber,
        providerMessageId: input.item.MessageID || undefined,
        lastError: failed ? input.item.Message || "Postmark campaign send failed" : null,
        nextRetryAt: null,
        sentAt: failed ? undefined : now,
      },
    }),
    db.emailDeliveryAttempt.update({
      where: { id: input.attemptId },
      data: {
        status: failed ? EmailDeliveryAttemptStatus.failed : EmailDeliveryAttemptStatus.sent,
        providerMessageId: input.item.MessageID || undefined,
        errorMessage: failed ? input.item.Message || "Postmark campaign send failed" : null,
        responseJson: toJsonValue(input.item),
        finishedAt: now,
      },
    }),
  ]);
}

type StoredCampaignPayload = {
  htmlBody: string;
  textBody: string;
};

type PreparedCampaignDelivery = {
  id: string;
  toEmail: string;
  subject: string;
  tag: string;
  messageStream: string | null;
  payloadJson: unknown;
  metadataJson: unknown;
  attemptCount: number;
  payload?: StoredCampaignPayload;
};

function readStoredCampaignPayload(value: unknown): StoredCampaignPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("CAMPAIGN_DELIVERY_PAYLOAD_INVALID");
  }
  const record = value as Record<string, unknown>;
  if (typeof record.htmlBody !== "string" || typeof record.textBody !== "string") {
    throw new Error("CAMPAIGN_DELIVERY_PAYLOAD_INVALID");
  }
  return { htmlBody: record.htmlBody, textBody: record.textBody };
}

function readStoredMetadata(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

async function refreshCampaignCounts(campaignId: string, fallbackError?: string) {
  const grouped = await db.emailDelivery.groupBy({
    by: ["status"],
    where: { campaignId, OR: [{ resolvedAt: null }, { status: EmailDeliveryStatus.sent }] },
    _count: { _all: true },
  });
  const counts = new Map(grouped.map((row) => [row.status, row._count._all]));
  const sentCount = counts.get(EmailDeliveryStatus.sent) || 0;
  const failedCount =
    (counts.get(EmailDeliveryStatus.failed) || 0) +
    (counts.get(EmailDeliveryStatus.dead_letter) || 0);
  const queuedCount = counts.get(EmailDeliveryStatus.queued) || 0;
  const ambiguousCount = counts.get(EmailDeliveryStatus.sending) || 0;
  const recipientCount = sentCount + failedCount + queuedCount + ambiguousCount;
  const status =
    ambiguousCount > 0
      ? "reconciliation_required"
      : failedCount > 0
        ? sentCount > 0
          ? "failed_partial"
          : "failed"
        : queuedCount > 0
          ? "queued"
          : recipientCount === 0
            ? "sent"
            : "sent";

  await db.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status,
      sentAt: sentCount > 0 ? new Date() : undefined,
      sentCount,
      failedCount,
      errorSummary: fallbackError?.slice(0, 2000) || null,
    },
  });

  return { status, sentCount, failedCount, queuedCount, ambiguousCount };
}

export async function reconcileContentfulCampaign(input: {
  campaignId: string;
  resolution: "confirm_delivered" | "confirm_not_sent";
  deliveries: Array<{ id: string; attemptCount: number }>;
  note: string;
  actorUserId: string;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
}) {
  if (
    !input.deliveries?.length ||
    !input.note?.trim() ||
    input.note.length > 2000 ||
    new Set(input.deliveries.map((row) => row.id)).size !== input.deliveries.length
  ) {
    throw new Error("CAMPAIGN_RECONCILIATION_EVIDENCE_REQUIRED");
  }
  return withCampaignLease(input.campaignId, async () => {
    const campaign = await db.emailCampaign.findUnique({
      where: { id: input.campaignId },
      select: {
        id: true,
        status: true,
        sentCount: true,
        failedCount: true,
        errorSummary: true,
        contentfulEntryId: true,
      },
    });
    if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");

    const ambiguous = await db.emailDelivery.findMany({
      where: {
        campaignId: campaign.id,
        status: EmailDeliveryStatus.sending,
        resolvedAt: null,
        OR: input.deliveries.map(({ id, attemptCount }) => ({ id, attemptCount })),
      },
      select: { id: true },
    });
    if (ambiguous.length !== input.deliveries.length) {
      await refreshCampaignCounts(campaign.id);
      throw new Error("CAMPAIGN_RECONCILIATION_NOT_REQUIRED");
    }

    const now = new Date();
    const deliveryIds = ambiguous.map((delivery) => delivery.id);
    await db.$transaction([
      db.emailDelivery.updateMany({
        where: { id: { in: deliveryIds }, status: EmailDeliveryStatus.sending },
        data:
          input.resolution === "confirm_delivered"
            ? {
                status: EmailDeliveryStatus.sent,
                retryable: false,
                sentAt: now,
                nextRetryAt: null,
                lastError: null,
                resolutionNote: input.note.trim(),
                resolvedByUserId: input.actorUserId,
              }
            : {
                status: EmailDeliveryStatus.failed,
                retryable: true,
                nextRetryAt: now,
                lastError: "Administrator confirmed that the provider did not send this message.",
                resolutionNote: input.note.trim(),
                resolvedByUserId: input.actorUserId,
              },
      }),
      db.emailDeliveryAttempt.updateMany({
        where: {
          deliveryId: { in: deliveryIds },
          status: EmailDeliveryAttemptStatus.started,
        },
        data:
          input.resolution === "confirm_delivered"
            ? {
                status: EmailDeliveryAttemptStatus.sent,
                finishedAt: now,
                errorMessage: null,
              }
            : {
                status: EmailDeliveryAttemptStatus.failed,
                finishedAt: now,
                errorMessage:
                  "Administrator confirmed that the provider did not send this message.",
              },
      }),
    ]);

    const counts = await refreshCampaignCounts(campaign.id);
    const result = {
      ok: true,
      campaignId: campaign.id,
      resolution: input.resolution,
      reconciledCount: ambiguous.length,
      status: counts.status,
    };

    await createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "newsletter_campaign_reconciled",
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
      newValueJson: { ...result, deliveryIds, note: input.note.trim() },
    });

    return result;
  });
}

async function prepareCampaignAudience(params: {
  campaignId: string;
  contentType: SupportedContentType;
  contentfulEntryId: string;
  audienceType: CampaignAudienceType;
  entry: NonNullable<CampaignEntry>;
  audience: CampaignRecipient[];
}) {
  const audience = params.audience;
  const prepared: PreparedCampaignDelivery[] = [];
  for (const recipient of audience) {
    const unsubscribeUrl = `${getBaseSiteUrlFromEnv()}/unsubscribe?token=${encodeURIComponent(
      createSignedUnsubscribeToken(recipient.subscriberId)
    )}`;
    const rendered = await renderCampaignMessage(
      params.contentType,
      params.entry,
      recipient.firstName,
      unsubscribeUrl
    );
    const tag = `newsletter-campaign-${params.campaignId}`;
    const metadata: Record<string, string> = {
      emailCategory: "marketing",
      campaignId: params.campaignId,
      contentfulEntryId: params.contentfulEntryId,
      audienceType: params.audienceType,
      source: "contentful_publish",
      subscriberId: recipient.subscriberId,
    };
    prepared.push(
      await createCampaignDelivery({
        recipient,
        campaignId: params.campaignId,
        contentType: params.contentType,
        subject: rendered.subject,
        htmlBody: rendered.html,
        textBody: rendered.text,
        tag,
        metadata,
      })
    );
  }

  await db.emailCampaign.update({
    where: { id: params.campaignId },
    data: { audiencePreparedAt: new Date(), status: "sending" },
  });
  return prepared;
}

async function sendPreparedCampaignDeliveries(
  campaignId: string,
  deliveries: PreparedCampaignDelivery[]
) {
  return withCampaignLease(campaignId, async (token) => {
    const ambiguous = await db.emailDelivery.count({
      where: { campaignId, status: EmailDeliveryStatus.sending },
    });
    if (ambiguous > 0) throw new Error("CAMPAIGN_RECONCILIATION_REQUIRED");
    const postmarkToken = getPostmarkToken();
    if (!postmarkToken) throw new Error("POSTMARK_NOT_CONFIGURED");
    const client = new ServerClient(postmarkToken, { timeout: 60 });
    const errors: string[] = [];

    for (const deliveryBatch of chunk(deliveries, 300)) {
      await renewCampaignLease(campaignId, token);
      const subscribed = new Set(
        (
          await db.newsletterSubscriber.findMany({
            where: { status: "subscribed", email: { in: deliveryBatch.map((row) => row.toEmail) } },
            select: { email: true },
          })
        ).map((row) => row.email.toLowerCase())
      );
      const claimed: Array<{
        delivery: PreparedCampaignDelivery;
        attemptId: string;
        attemptNumber: number;
      }> = [];
      for (const delivery of deliveryBatch) {
        if (!subscribed.has(delivery.toEmail.toLowerCase())) {
          await db.emailDelivery.updateMany({
            where: {
              id: delivery.id,
              status: { in: [EmailDeliveryStatus.queued, EmailDeliveryStatus.failed] },
              resolvedAt: null,
            },
            data: {
              retryable: false,
              resolvedAt: new Date(),
              resolutionCode: "recipient_not_subscribed",
              nextRetryAt: null,
            },
          });
          continue;
        }
        readStoredCampaignPayload(delivery.payloadJson);
        const attemptNumber = delivery.attemptCount + 1;
        const attempt = await db.$transaction(async (tx) => {
          const claim = await tx.emailDelivery.updateMany({
            where: {
              id: delivery.id,
              status: { in: [EmailDeliveryStatus.queued, EmailDeliveryStatus.failed] },
              resolvedAt: null,
              retryable: true,
              attemptCount: delivery.attemptCount,
            },
            data: { status: EmailDeliveryStatus.sending, attemptCount: attemptNumber },
          });
          if (claim.count === 0) return null;
          return tx.emailDeliveryAttempt.create({
            data: {
              deliveryId: delivery.id,
              attemptNumber,
              status: EmailDeliveryAttemptStatus.started,
            },
            select: { id: true },
          });
        });
        if (!attempt) continue;
        claimed.push({ delivery, attemptId: attempt.id, attemptNumber });
      }

      if (claimed.length === 0) continue;
      const messages = claimed.map(({ delivery }) => {
        const payload = delivery.payload || readStoredCampaignPayload(delivery.payloadJson);
        const metadata = readStoredMetadata(delivery.metadataJson);
        return {
          From: POSTMARK_FROM_EMAIL,
          To: delivery.toEmail,
          Subject: delivery.subject,
          HtmlBody: payload.htmlBody,
          TextBody: payload.textBody,
          MessageStream: delivery.messageStream || POSTMARK_STREAM,
          Tag: delivery.tag,
          Metadata: { ...metadata, deliveryId: delivery.id },
        };
      });

      await renewCampaignLease(campaignId, token);
      const response = (await client.sendEmailBatch(messages)) as SendEmailBatchResponse;
      await renewCampaignLease(campaignId, token);
      const items = response as Array<{
        ErrorCode?: number;
        Message?: string;
        MessageID?: string;
      }>;

      for (const [index, item] of items.entries()) {
        const delivery = claimed[index];
        if (delivery) {
          await recordCampaignDeliveryResult({
            deliveryId: delivery.delivery.id,
            attemptId: delivery.attemptId,
            attemptNumber: delivery.attemptNumber,
            item,
          });
        }

        if (item.ErrorCode && item.ErrorCode !== 0) {
          if (item.Message) errors.push(item.Message);
        }
      }
    }
    return refreshCampaignCounts(
      campaignId,
      errors.length ? Array.from(new Set(errors)).join(" | ") : undefined
    );
  });
}

const CAMPAIGN_LEASE_MS = 15 * 60 * 1000;

async function renewCampaignLease(campaignId: string, token: string) {
  const renewed = await db.emailCampaign.updateMany({
    where: { id: campaignId, processingToken: token },
    data: { processingLeaseExpiresAt: new Date(Date.now() + CAMPAIGN_LEASE_MS) },
  });
  if (!renewed.count) throw new Error("CAMPAIGN_BUSY");
}

async function withCampaignLease<T>(
  campaignId: string,
  work: (token: string) => Promise<T>
): Promise<T> {
  const token = randomUUID();
  const claim = await db.emailCampaign.updateMany({
    where: {
      id: campaignId,
      OR: [{ processingLeaseExpiresAt: null }, { processingLeaseExpiresAt: { lt: new Date() } }],
    },
    data: {
      processingToken: token,
      processingLeaseExpiresAt: new Date(Date.now() + CAMPAIGN_LEASE_MS),
    },
  });
  if (!claim.count) throw new Error("CAMPAIGN_BUSY");
  try {
    return await work(token);
  } catch (error) {
    await refreshCampaignCounts(
      campaignId,
      error instanceof Error ? error.message : "Campaign interrupted"
    );
    throw error;
  } finally {
    await db.emailCampaign.updateMany({
      where: { id: campaignId, processingToken: token },
      data: { processingToken: null, processingLeaseExpiresAt: null },
    });
  }
}

function readFrozenAudience(value: unknown): CampaignRecipient[] {
  if (!Array.isArray(value)) throw new Error("CAMPAIGN_AUDIENCE_REQUIRES_REVIEW");
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item))
      throw new Error("CAMPAIGN_AUDIENCE_REQUIRES_REVIEW");
    const row = item as Record<string, unknown>;
    if (
      typeof row.subscriberId !== "string" ||
      typeof row.email !== "string" ||
      typeof row.firstName !== "string" ||
      (row.userId !== null && typeof row.userId !== "string")
    )
      throw new Error("CAMPAIGN_AUDIENCE_REQUIRES_REVIEW");
    return {
      subscriberId: row.subscriberId,
      email: row.email,
      firstName: row.firstName,
      userId: row.userId as string | null,
    };
  });
}

function getSourceIssueKey(contentType: SupportedContentType, entryId: string) {
  const space = process.env.CONTENTFUL_SPACE_ID || "unknown-space";
  const environment = process.env.CONTENTFUL_ENVIRONMENT || "master";
  return `contentful:${space}:${environment}:${contentType}:${entryId}`;
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
  const audienceType = mapAudience(contentType);
  const sourceIssueKey = getSourceIssueKey(contentType, input.contentfulEntryId);
  const existingByIssue = await db.emailCampaign.findUnique({
    where: { sourceIssueKey },
    select: { id: true, status: true },
  });
  const legacyExisting = existingByIssue
    ? null
    : await db.emailCampaign.findFirst({
        where: {
          contentfulEntryId: input.contentfulEntryId,
          contentfulContentType: contentType,
          audienceType,
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, status: true },
      });
  const existing = existingByIssue || legacyExisting;
  if (existing) {
    if (!existingByIssue) {
      await db.emailCampaign.update({
        where: { id: existing.id },
        data: { sourceIssueKey },
      });
    }
    return {
      skipped: true as const,
      reason: getAlreadyProcessedReason(existing.status),
      campaignId: existing.id,
    };
  }

  const entry = await loadEntry(contentType, input.contentfulEntryId);
  if (!entry) {
    throw new Error("CONTENTFUL_ENTRY_NOT_FOUND");
  }

  const readiness = getPublishReadiness({
    contentType,
    fields: entry.fields,
  });
  if (!readiness.ready) {
    return { skipped: true as const, reason: readiness.reason };
  }

  const providerCampaignId = `contentful:${contentType}:${input.contentfulEntryId}:${audienceType}`;
  const audience = await getAudienceEmails();
  let campaign: { id: string };
  try {
    campaign = await db.emailCampaign.create({
      data: {
        providerCampaignId,
        sourceIssueKey,
        sourceVersion: input.contentfulVersion || null,
        contentSnapshotJson: toJsonValue(entry),
        audienceSnapshotJson: toJsonValue(audience),
        subject: getEntrySubject(contentType, entry.fields),
        stream: POSTMARK_STREAM,
        status: "preparing",
        audienceType,
        triggeredBy: "contentful_publish",
        contentfulEntryId: input.contentfulEntryId,
        contentfulContentType: contentType,
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await db.emailCampaign.findUnique({
        where: { sourceIssueKey },
        select: { id: true, status: true },
      });
      if (raced) {
        return {
          skipped: true as const,
          reason: getAlreadyProcessedReason(raced.status),
          campaignId: raced.id,
        };
      }
    }
    throw error;
  }

  try {
    const deliveries = await prepareCampaignAudience({
      campaignId: campaign.id,
      contentType,
      contentfulEntryId: input.contentfulEntryId,
      audienceType,
      entry,
      audience,
    });
    await sendPreparedCampaignDeliveries(campaign.id, deliveries);
    return { skipped: false as const, campaignId: campaign.id };
  } catch (error) {
    await refreshCampaignCounts(
      campaign.id,
      error instanceof Error ? error.message : "Failed to send campaign"
    );
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
      audiencePreparedAt: true,
      contentSnapshotJson: true,
      audienceSnapshotJson: true,
    },
  });
  if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");
  if (
    !campaign.contentfulEntryId ||
    !campaign.contentfulContentType ||
    !campaign.contentSnapshotJson
  ) {
    throw new Error("CAMPAIGN_NOT_RETRYABLE");
  }

  if (!campaign.audiencePreparedAt) {
    if (
      campaign.contentfulContentType !== "blogPost" &&
      campaign.contentfulContentType !== "newsletterTemplate"
    )
      throw new Error("CAMPAIGN_NOT_RETRYABLE");
    const entry = campaign.contentSnapshotJson as NonNullable<CampaignEntry>;
    if (!entry.fields || typeof entry.fields !== "object")
      throw new Error("CAMPAIGN_NOT_RETRYABLE");
    await prepareCampaignAudience({
      campaignId: campaign.id,
      contentType: campaign.contentfulContentType,
      contentfulEntryId: campaign.contentfulEntryId,
      audienceType: mapAudience(campaign.contentfulContentType),
      entry,
      audience: readFrozenAudience(campaign.audienceSnapshotJson),
    });
  }

  const ambiguous = await db.emailDelivery.count({
    where: { campaignId: campaign.id, status: EmailDeliveryStatus.sending },
  });
  if (ambiguous > 0) throw new Error("CAMPAIGN_RECONCILIATION_REQUIRED");

  const retryable = await db.emailDelivery.findMany({
    where: {
      campaignId: campaign.id,
      status: { in: [EmailDeliveryStatus.queued, EmailDeliveryStatus.failed] },
      retryable: true,
      resolvedAt: null,
    },
    select: {
      id: true,
      toEmail: true,
      subject: true,
      tag: true,
      messageStream: true,
      payloadJson: true,
      metadataJson: true,
      attemptCount: true,
    },
  });

  const activeSubscribers = new Set(
    (
      await db.newsletterSubscriber.findMany({
        where: {
          status: "subscribed",
          email: { in: retryable.map((delivery) => delivery.toEmail.trim().toLowerCase()) },
        },
        select: { email: true },
      })
    ).map((subscriber) => subscriber.email.trim().toLowerCase())
  );
  const eligible = retryable.filter((delivery) =>
    activeSubscribers.has(delivery.toEmail.trim().toLowerCase())
  );
  const suppressed = retryable.filter(
    (delivery) => !activeSubscribers.has(delivery.toEmail.trim().toLowerCase())
  );
  if (suppressed.length) {
    await db.emailDelivery.updateMany({
      where: { id: { in: suppressed.map((delivery) => delivery.id) } },
      data: {
        retryable: false,
        resolvedAt: new Date(),
        resolutionCode: "recipient_not_subscribed",
        resolutionNote: "Not retried because the original recipient is no longer subscribed.",
        nextRetryAt: null,
      },
    });
  }

  if (eligible.length) {
    await sendPreparedCampaignDeliveries(campaign.id, eligible);
  } else {
    await refreshCampaignCounts(campaign.id);
  }

  const result = {
    ok: true,
    campaignId: campaign.id,
    retriedCount: eligible.length,
    suppressedCount: suppressed.length,
  };

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
      audiencePreparedAt: true,
    },
  });

  let processed = 0;
  let failed = 0;

  for (const campaign of campaigns) {
    if (
      !campaign.contentfulEntryId ||
      !campaign.contentfulContentType ||
      !campaign.audiencePreparedAt
    ) {
      continue;
    }
    try {
      const deliveries = await db.emailDelivery.findMany({
        where: {
          campaignId: campaign.id,
          status: EmailDeliveryStatus.queued,
          resolvedAt: null,
        },
        select: {
          id: true,
          toEmail: true,
          subject: true,
          tag: true,
          messageStream: true,
          payloadJson: true,
          metadataJson: true,
          attemptCount: true,
        },
      });
      await sendPreparedCampaignDeliveries(campaign.id, deliveries);
      processed += 1;
    } catch (error) {
      failed += 1;
      if (!(error instanceof Error && error.message === "CAMPAIGN_BUSY")) {
        await refreshCampaignCounts(
          campaign.id,
          error instanceof Error ? error.message : "Failed to send scheduled campaign"
        );
      }
    }
  }

  return {
    ok: failed === 0,
    scanned: campaigns.length,
    processed,
    failed,
  };
}
