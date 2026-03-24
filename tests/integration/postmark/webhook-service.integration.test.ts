import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { ingestPostmarkEvent } from "@/lib/postmark/webhook-service";

const USER_PREFIX = "integration-postmark-webhook-";

async function cleanupRows() {
  await db.emailEvent.deleteMany({
    where: {
      email: { startsWith: USER_PREFIX },
    },
  });
  await db.emailCampaign.deleteMany({
    where: {
      providerCampaignId: { startsWith: "integration-postmark-" },
    },
  });
  await db.user.deleteMany({
    where: {
      email: { startsWith: USER_PREFIX },
    },
  });
}

function createEmail(label: string) {
  return `${USER_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe("ingestPostmarkEvent", () => {
  beforeEach(async () => {
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("upserts the campaign and event rows and links the user by email", async () => {
    const user = await db.user.create({
      data: {
        email: createEmail("member"),
      },
    });

    await ingestPostmarkEvent({
      ID: 101,
      RecordType: "Delivered",
      MessageID: "message-123",
      MessageStream: "outbound",
      Recipient: user.email,
      ReceivedAt: "2026-03-22T10:00:00.000Z",
      Subject: "Admin member update",
      Tag: "integration-postmark-admin-member-message",
      Metadata: {
        memberId: user.id,
        source: "admin-member-detail",
      },
    });

    const [campaign, event] = await Promise.all([
      db.emailCampaign.findUnique({
        where: { providerCampaignId: "integration-postmark-admin-member-message" },
      }),
      db.emailEvent.findUnique({
        where: { providerEventId: "101" },
      }),
    ]);

    expect(campaign).toMatchObject({
      subject: "Admin member update",
      status: "sent",
    });
    expect(event).toMatchObject({
      type: "Delivered",
      email: user.email,
      userId: user.id,
      campaignId: campaign?.id,
    });
  });
});
