import "server-only";

import { render } from "@react-email/render";
import { EmailDeliveryAttemptStatus, EmailDeliveryStatus, type Prisma } from "@prisma/client";
import { ServerClient } from "postmark";
import { db } from "@/lib/db";
import { env, getPostmarkToken } from "@/lib/env";

const FALLBACK_FROM = "Shruti Turner <shruti@shrutiturner.co.uk>";

export type EmailCategory = "marketing" | "transactional";
export type EmailDispatchMode = "immediate_required" | "immediate_best_effort";

type EmailAttachment = {
  name: string;
  content: string;
  contentType: string;
};

type StoredEmailPayload = {
  htmlBody: string;
  textBody: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

const EMAIL_RETRY_DELAYS_MINUTES = [5, 30, 120, 720] as const;

export function getPostmarkClient() {
  const token = getPostmarkToken();
  if (!token) {
    throw new Error("POSTMARK_NOT_CONFIGURED");
  }
  return new ServerClient(token);
}

export function getPostmarkFromEmail() {
  return env.POSTMARK_FROM_EMAIL || FALLBACK_FROM;
}

export function getPostmarkMessageStream(category: EmailCategory = "transactional") {
  if (category === "marketing") {
    return env.POSTMARK_MARKETING_MESSAGE_STREAM || env.POSTMARK_MESSAGE_STREAM || "outbound";
  }

  return env.POSTMARK_TRANSACTIONAL_MESSAGE_STREAM || env.POSTMARK_MESSAGE_STREAM || "outbound";
}

export function extractPrimaryEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] || value).trim();
}

export function getNotificationInbox(envName: string, fallback?: string) {
  const configured = process.env[envName];
  if (configured?.trim()) return configured.trim();
  if (fallback?.trim()) return fallback.trim();
  return extractPrimaryEmailAddress(getPostmarkFromEmail());
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function serializeMetadata(input?: Record<string, string>) {
  if (!input) return undefined;
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function getNextRetryAt(attemptNumber: number) {
  const delayMinutes = EMAIL_RETRY_DELAYS_MINUTES[attemptNumber - 1];
  if (!delayMinutes) {
    return null;
  }

  return new Date(Date.now() + delayMinutes * 60 * 1000);
}

export function getEmailRetryScheduleMinutes() {
  return [...EMAIL_RETRY_DELAYS_MINUTES];
}

async function sendPreparedPostmarkEmail(input: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  tag: string;
  category?: EmailCategory;
  replyTo?: string;
  messageStream?: string;
  metadata?: Record<string, string>;
  attachments?: EmailAttachment[];
}) {
  const client = getPostmarkClient();
  const category = input.category || "transactional";

  return client.sendEmail({
    From: getPostmarkFromEmail(),
    To: input.to,
    Subject: input.subject,
    HtmlBody: input.htmlBody,
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

export async function attemptEmailDelivery(deliveryId: string) {
  const existing = await db.emailDelivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      toEmail: true,
      userId: true,
      campaignId: true,
      templateKey: true,
      category: true,
      subject: true,
      tag: true,
      messageStream: true,
      status: true,
      retryable: true,
      attemptCount: true,
      maxAttempts: true,
      resolvedAt: true,
      payloadJson: true,
      metadataJson: true,
    },
  });

  if (!existing) {
    throw new Error("EMAIL_DELIVERY_NOT_FOUND");
  }

  if (existing.resolvedAt) {
    return { skipped: true as const, reason: "resolved" };
  }

  if (
    existing.status === EmailDeliveryStatus.sent ||
    existing.status === EmailDeliveryStatus.dead_letter
  ) {
    return { skipped: true as const, reason: "terminal" };
  }

  const claimed = await db.emailDelivery.updateMany({
    where: {
      id: deliveryId,
      status: {
        in: [EmailDeliveryStatus.queued, EmailDeliveryStatus.failed],
      },
      resolvedAt: null,
    },
    data: {
      status: EmailDeliveryStatus.sending,
    },
  });

  if (claimed.count === 0) {
    return { skipped: true as const, reason: "busy" };
  }

  const attemptNumber = existing.attemptCount + 1;
  const payload = existing.payloadJson as StoredEmailPayload;
  const metadata = serializeMetadata(existing.metadataJson as Record<string, string> | undefined);

  const attempt = await db.emailDeliveryAttempt.create({
    data: {
      deliveryId,
      attemptNumber,
      status: EmailDeliveryAttemptStatus.started,
    },
  });

  try {
    const rawResponse = await sendPreparedPostmarkEmail({
      to: existing.toEmail,
      subject: existing.subject,
      htmlBody: payload.htmlBody,
      textBody: payload.textBody,
      tag: existing.tag,
      category: existing.category as EmailCategory,
      replyTo: payload.replyTo,
      messageStream: existing.messageStream || undefined,
      metadata: {
        ...metadata,
        deliveryId,
        templateKey: existing.templateKey,
      },
      attachments: payload.attachments,
    });
    const response =
      rawResponse && typeof rawResponse === "object"
        ? (rawResponse as unknown as { MessageID?: string } & Record<string, unknown>)
        : {};

    const providerMessageId =
      typeof response.MessageID === "string" && response.MessageID.trim()
        ? response.MessageID.trim()
        : null;

    await db.$transaction([
      db.emailDeliveryAttempt.update({
        where: { id: attempt.id },
        data: {
          status: EmailDeliveryAttemptStatus.sent,
          providerMessageId,
          responseJson: toJsonValue(response),
          finishedAt: new Date(),
        },
      }),
      db.emailDelivery.update({
        where: { id: deliveryId },
        data: {
          status: EmailDeliveryStatus.sent,
          attemptCount: attemptNumber,
          providerMessageId,
          lastError: null,
          nextRetryAt: null,
          sentAt: new Date(),
          resolvedAt: null,
          resolvedByUserId: null,
          resolutionCode: null,
          resolutionNote: null,
        },
      }),
    ]);

    return {
      skipped: false as const,
      status: EmailDeliveryStatus.sent,
      attemptNumber,
      providerMessageId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "EMAIL_SEND_FAILED";
    const nextRetryAt =
      existing.retryable && attemptNumber < existing.maxAttempts
        ? getNextRetryAt(attemptNumber)
        : null;
    const nextStatus = nextRetryAt ? EmailDeliveryStatus.failed : EmailDeliveryStatus.dead_letter;

    await db.$transaction([
      db.emailDeliveryAttempt.update({
        where: { id: attempt.id },
        data: {
          status: EmailDeliveryAttemptStatus.failed,
          errorMessage: message,
          finishedAt: new Date(),
        },
      }),
      db.emailDelivery.update({
        where: { id: deliveryId },
        data: {
          status: nextStatus,
          attemptCount: attemptNumber,
          lastError: message,
          nextRetryAt,
        },
      }),
    ]);

    throw error;
  }
}

export async function processDueEmailDeliveries(limit = 50) {
  const now = new Date();
  const deliveries = await db.emailDelivery.findMany({
    where: {
      status: {
        in: [EmailDeliveryStatus.queued, EmailDeliveryStatus.failed],
      },
      resolvedAt: null,
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    orderBy: [{ createdAt: "asc" }],
    take: limit,
    select: { id: true },
  });

  let sent = 0;
  let failed = 0;
  let deadLettered = 0;
  let skipped = 0;

  for (const delivery of deliveries) {
    try {
      const result = await attemptEmailDelivery(delivery.id);

      if (result.skipped) {
        skipped += 1;
      } else if (result.status === EmailDeliveryStatus.sent) {
        sent += 1;
      }
    } catch {
      const refreshed = await db.emailDelivery.findUnique({
        where: { id: delivery.id },
        select: { status: true },
      });

      if (refreshed?.status === EmailDeliveryStatus.dead_letter) {
        deadLettered += 1;
      } else {
        failed += 1;
      }
    }
  }

  return {
    attempted: deliveries.length,
    sent,
    failed,
    deadLettered,
    skipped,
  };
}

export async function sendPostmarkReactEmail(input: {
  to: string;
  subject: string;
  react: React.ReactElement;
  textBody: string;
  tag: string;
  templateKey?: string;
  category?: EmailCategory;
  replyTo?: string;
  messageStream?: string;
  metadata?: Record<string, string>;
  userId?: string;
  campaignId?: string;
  retryable?: boolean;
  maxAttempts?: number;
  dispatchMode?: EmailDispatchMode;
  attachments?: Array<{
    name: string;
    content: string;
    contentType: string;
  }>;
}) {
  const html = await render(input.react);
  const category = input.category || "transactional";
  const dispatchMode = input.dispatchMode || "immediate_required";
  const delivery = await db.emailDelivery.create({
    data: {
      toEmail: input.to,
      userId: input.userId || null,
      campaignId: input.campaignId || null,
      templateKey: input.templateKey || input.tag,
      category,
      provider: "postmark",
      subject: input.subject,
      tag: input.tag,
      messageStream: input.messageStream || getPostmarkMessageStream(category),
      retryable: input.retryable ?? true,
      maxAttempts: input.maxAttempts ?? 5,
      payloadJson: {
        htmlBody: html,
        textBody: input.textBody,
        replyTo: input.replyTo,
        attachments: input.attachments,
      } satisfies StoredEmailPayload as Prisma.InputJsonValue,
      metadataJson: toJsonValue(input.metadata),
    },
  });

  try {
    return await attemptEmailDelivery(delivery.id);
  } catch (error) {
    if (dispatchMode === "immediate_required") {
      throw error;
    }

    const refreshed = await db.emailDelivery.findUnique({
      where: { id: delivery.id },
      select: {
        id: true,
        status: true,
        attemptCount: true,
        nextRetryAt: true,
      },
    });

    return {
      skipped: false as const,
      deliveryId: delivery.id,
      status: refreshed?.status || EmailDeliveryStatus.failed,
      attemptNumber: refreshed?.attemptCount || 0,
      nextRetryAt: refreshed?.nextRetryAt || null,
    };
  }
}
