import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { ServerClient } from "postmark";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function loadEnv() {
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  loadEnvFile(path.resolve(process.cwd(), ".env"));
}

type PostmarkMessage = {
  MessageID?: string;
  Subject?: string;
  ReceivedAt?: string;
  MessageStream?: string;
  To?: string;
  Tag?: string;
};

async function main() {
  loadEnv();
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    throw new Error("Missing POSTMARK_API_TOKEN");
  }

  const prisma = new PrismaClient();
  const client = new ServerClient(token);
  const count = Number(process.env.POSTMARK_SYNC_COUNT || "50");

  const result = await (client as any).getOutboundMessages({
    count,
    offset: 0,
  });

  const messages = (result?.Messages || result?.messages || []) as PostmarkMessage[];
  let processed = 0;

  for (const message of messages) {
    const messageId = message.MessageID;
    if (!messageId) continue;
    const providerCampaignId = message.Tag || messageId;
    const sentAt = message.ReceivedAt ? new Date(message.ReceivedAt) : new Date();
    const recipient = (message.To || "").trim().toLowerCase();

    const campaign = await prisma.emailCampaign.upsert({
      where: { providerCampaignId },
      create: {
        providerCampaignId,
        subject: message.Subject || "Postmark campaign",
        stream: message.MessageStream || null,
        status: "sent",
        sentAt,
      },
      update: {
        subject: message.Subject || undefined,
        stream: message.MessageStream || undefined,
        status: "sent",
        sentAt,
      },
      select: { id: true },
    });

    if (recipient) {
      const user = await prisma.user.findUnique({
        where: { email: recipient },
        select: { id: true },
      });

      await prisma.emailEvent.upsert({
        where: { providerEventId: `sync:${messageId}:Delivery` },
        create: {
          provider: "postmark",
          providerEventId: `sync:${messageId}:Delivery`,
          messageId,
          type: "Delivery",
          email: recipient,
          userId: user?.id,
          campaignId: campaign.id,
          eventAt: sentAt,
        },
        update: {
          campaignId: campaign.id,
          eventAt: sentAt,
        },
      });
    }

    processed += 1;
  }

  console.log(`Postmark sync complete. Processed ${processed} messages.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Postmark sync failed:", error);
  process.exitCode = 1;
});
