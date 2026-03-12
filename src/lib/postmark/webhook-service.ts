import { createHmac, timingSafeEqual } from "node:crypto";
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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toDate(value: string | undefined) {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
}

export function verifyPostmarkWebhook(body: string, signatureHeader: string | null, secret: string) {
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
  const type = payload.RecordType || "Unknown";
  const recipient = normalizeEmail(payload.Recipient || "");
  if (!recipient) {
    throw new Error("MISSING_RECIPIENT");
  }

  const messageId = payload.MessageID || null;
  const providerEventId = payload.ID ? String(payload.ID) : `${messageId || "msg"}:${type}:${recipient}:${Date.now()}`;
  const eventAt = toDate(payload.ReceivedAt);
  const metadata = {
    ...(payload.Metadata || {}),
    stream: payload.MessageStream || null,
    tag: payload.Tag || null,
    url: payload.OriginalLink || null,
  };

  const user = await db.user.findUnique({
    where: { email: recipient },
    select: { id: true },
  });

  let campaignId: string | undefined;
  const explicitCampaignId =
    typeof metadata.campaignId === "string" && metadata.campaignId
      ? metadata.campaignId
      : undefined;
  if (explicitCampaignId) {
    const existingById = await db.emailCampaign.findUnique({
      where: { id: explicitCampaignId },
      select: { id: true },
    });
    if (existingById) {
      campaignId = existingById.id;
    }
  }

  const providerCampaignId =
    (campaignId ? undefined : explicitCampaignId) ||
    (typeof payload.Tag === "string" && payload.Tag) ||
    (messageId || undefined);

  if (!campaignId && providerCampaignId) {
    const campaign = await db.emailCampaign.upsert({
      where: { providerCampaignId },
      create: {
        providerCampaignId,
        subject: payload.Subject || "Untitled campaign",
        stream: payload.MessageStream || null,
        status: type === "Scheduled" ? "scheduled" : "sent",
        sentAt: type === "Scheduled" ? null : eventAt,
        scheduledAt: type === "Scheduled" ? eventAt : null,
        metadataJson: metadata,
      },
      update: {
        subject: payload.Subject || undefined,
        stream: payload.MessageStream || undefined,
        status: type === "Scheduled" ? "scheduled" : "sent",
        sentAt: type === "Scheduled" ? undefined : eventAt,
        metadataJson: metadata,
      },
      select: { id: true },
    });
    campaignId = campaign.id;
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
      eventAt,
      metadataJson: metadata,
    },
    update: {
      type,
      email: recipient,
      userId: user?.id,
      campaignId,
      eventAt,
      metadataJson: metadata,
    },
  });

  return { providerEventId };
}
