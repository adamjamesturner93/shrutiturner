import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type RawPostmarkEvent = {
  ID?: number;
  RecordType?: string;
  MessageID?: string;
  MessageStream?: string;
  Recipient?: string;
  ReceivedAt?: string;
  Subject?: string;
  Tag?: string;
  Metadata?: Record<string, unknown>;
  OriginalLink?: string;
};

type LinkedDelivery = {
  id: string;
  campaignId: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toDate(value: string | undefined) {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
}

function normalizeEventType(recordType: string) {
  const compact = recordType.replace(/[\s_-]/g, "").toLowerCase();
  switch (compact) {
    case "delivery":
    case "delivered":
      return "delivered";
    case "open":
    case "opened":
      return "opened";
    case "click":
    case "clicked":
      return "clicked";
    case "bounce":
    case "bounced":
      return "bounced";
    case "spamcomplaint":
    case "spam":
    case "complaint":
      return "spam_complaint";
    case "subscriptionchange":
    case "unsubscribe":
    case "unsubscribed":
      return "unsubscribed";
    default:
      return recordType || "unknown";
  }
}

async function suppressSubscriberForCompliance(input: {
  email: string;
  userId?: string | null;
  type: string;
}) {
  if (input.type !== "unsubscribed" && input.type !== "spam_complaint") {
    return;
  }

  const now = new Date();
  const subscriber = await db.newsletterSubscriber.findUnique({
    where: { email: input.email },
    select: { id: true, userId: true },
  });

  if (subscriber) {
    await db.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "unsubscribed",
        unsubscribedAt: now,
        verificationTokenHash: null,
        verificationTokenExpiresAt: null,
      },
    });
  }

  await db.emailDelivery.updateMany({
    where: {
      toEmail: input.email,
      category: "marketing",
      resolvedAt: null,
      status: { in: ["failed", "dead_letter"] },
    },
    data: {
      resolvedAt: now,
      resolutionCode: "recipient_suppressed",
      resolutionNote: `Resolved automatically after Postmark recorded ${input.type}.`,
      retryable: false,
      nextRetryAt: null,
    },
  });

  const userId = subscriber?.userId || input.userId;
  if (userId) {
    await db.userNotificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        marketingEmails: false,
        classReminders: true,
        scheduleUpdates: true,
        programAnnouncements: true,
      },
      update: {
        marketingEmails: false,
      },
    });
  }
}

export function verifyPostmarkWebhook(
  body: string,
  signatureHeader: string | null,
  secret: string
) {
  if (!signatureHeader) return false;
  const signature = signatureHeader.trim();

  const expectedHex = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  const expectedBase64 = createHmac("sha256", secret).update(body, "utf8").digest("base64");

  const hexMatch = timingSafeCompare(expectedHex.toLowerCase(), signature.toLowerCase());
  if (hexMatch) return true;

  return timingSafeCompare(expectedBase64, signature);
}

function timingSafeCompare(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function ingestPostmarkEvent(payload: RawPostmarkEvent) {
  const type = normalizeEventType(payload.RecordType || "Unknown");
  const recipient = normalizeEmail(payload.Recipient || "");
  if (!recipient) {
    throw new Error("MISSING_RECIPIENT");
  }

  const messageId = payload.MessageID || null;
  const providerEventId = payload.ID
    ? String(payload.ID)
    : `${messageId || "msg"}:${type}:${recipient}:${Date.now()}`;
  const eventAt = toDate(payload.ReceivedAt);
  const metadata = {
    ...(payload.Metadata || {}),
    stream: payload.MessageStream || null,
    tag: payload.Tag || null,
    url: payload.OriginalLink || null,
  } as Record<string, unknown>;

  const user = await db.user.findUnique({
    where: { email: recipient },
    select: { id: true },
  });

  const linkedDelivery = await findLinkedDelivery(metadata, messageId);

  let campaignId: string | undefined = linkedDelivery?.campaignId || undefined;
  const explicitCampaignId =
    typeof metadata.campaignId === "string" && metadata.campaignId
      ? metadata.campaignId
      : undefined;
  if (!campaignId && explicitCampaignId) {
    const existingById = await db.emailCampaign.findUnique({
      where: { id: explicitCampaignId },
      select: { id: true },
    });
    if (existingById) {
      campaignId = existingById.id;
    }
  }

  await db.emailEvent.upsert({
    where: { providerEventId },
    create: {
      provider: "postmark",
      providerEventId,
      messageId,
      type,
      email: recipient,
      userId: user?.id,
      campaignId,
      deliveryId: linkedDelivery?.id,
      eventAt,
      metadataJson: metadata as Prisma.InputJsonValue,
    },
    update: {
      type,
      email: recipient,
      userId: user?.id,
      campaignId,
      deliveryId: linkedDelivery?.id,
      eventAt,
      metadataJson: metadata as Prisma.InputJsonValue,
    },
  });

  await suppressSubscriberForCompliance({
    email: recipient,
    userId: user?.id,
    type,
  });

  return { providerEventId };
}

async function findLinkedDelivery(metadata: Record<string, unknown>, messageId: string | null) {
  const explicitDeliveryId =
    typeof metadata.deliveryId === "string" && metadata.deliveryId.trim()
      ? metadata.deliveryId.trim()
      : null;

  if (explicitDeliveryId) {
    const delivery = await db.emailDelivery.findUnique({
      where: { id: explicitDeliveryId },
      select: { id: true, campaignId: true },
    });
    if (delivery) {
      return delivery satisfies LinkedDelivery;
    }
  }

  if (!messageId) {
    return null;
  }

  const delivery = await db.emailDelivery.findFirst({
    where: { providerMessageId: messageId },
    select: { id: true, campaignId: true },
  });

  return delivery ? (delivery satisfies LinkedDelivery) : null;
}
