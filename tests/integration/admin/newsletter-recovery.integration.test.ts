import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

const provider = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("postmark", () => ({
  ServerClient: vi.fn(function () {
    return { sendEmailBatch: provider.send };
  }),
}));
process.env.POSTMARK_API_TOKEN = "fixture-token";
process.env.POSTMARK_FROM_EMAIL = "Test <test@example.com>";
const { retryContentfulCampaign, reconcileContentfulCampaign } =
  await import("@/lib/newsletter/campaign-automation");
const prefix = `recovery-${randomUUID()}`;
let actorId: string;
let campaignId: string;
let deliveryId: string;
const email = `${prefix}@example.com`;

beforeAll(async () => {
  if (!["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL!).hostname))
    throw new Error("Local database required");
  actorId = (await db.user.create({ data: { email: `actor-${email}` } })).id;
  await db.newsletterSubscriber.create({
    data: { email, status: "subscribed", source: "fixture", token: prefix },
  });
});
beforeEach(async () => {
  provider.send.mockResolvedValue([{ ErrorCode: 0, MessageID: randomUUID() }]);
  const campaign = await db.emailCampaign.create({
    data: {
      providerCampaignId: `${prefix}-${randomUUID()}`,
      subject: "Fixture",
      status: "failed",
      contentfulEntryId: prefix,
      contentfulContentType: "newsletterTemplate",
      contentSnapshotJson: { fields: { title: "Fixture", body: "Test" } },
      audiencePreparedAt: new Date(),
      audienceSnapshotJson: [],
    },
  });
  campaignId = campaign.id;
  deliveryId = (
    await db.emailDelivery.create({
      data: {
        campaignId,
        toEmail: email,
        templateKey: "fixture",
        subject: "Fixture",
        tag: "fixture",
        payloadJson: { htmlBody: "<p>Fixture</p>", textBody: "Fixture" },
      },
    })
  ).id;
});
afterAll(async () => {
  await db.emailDeliveryAttempt.deleteMany({
    where: { delivery: { campaign: { contentfulEntryId: prefix } } },
  });
  await db.emailDelivery.deleteMany({ where: { campaign: { contentfulEntryId: prefix } } });
  await db.emailCampaign.deleteMany({ where: { contentfulEntryId: prefix } });
  await db.newsletterSubscriber.deleteMany({ where: { email } });
  if (actorId) {
    await db.adminActionLog.deleteMany({ where: { actorUserId: actorId } });
    await db.user.delete({ where: { id: actorId } });
  }
  await db.$disconnect();
});

describe("newsletter recovery with real database claims", () => {
  it("concurrent retries never submit the same recipient twice", async () => {
    await Promise.allSettled([
      retryContentfulCampaign({ campaignId }),
      retryContentfulCampaign({ campaignId }),
    ]);
    expect(provider.send).toHaveBeenCalledTimes(1);
    expect(await db.emailDeliveryAttempt.count({ where: { deliveryId } })).toBe(1);
  });
  it("provider timeout becomes ambiguous, not automatically retryable", async () => {
    provider.send.mockRejectedValueOnce(new Error("connection lost"));
    await expect(retryContentfulCampaign({ campaignId })).rejects.toThrow("connection lost");
    await expect(retryContentfulCampaign({ campaignId })).rejects.toThrow(
      "CAMPAIGN_RECONCILIATION_REQUIRED"
    );
    expect(provider.send).toHaveBeenCalledTimes(1);
    expect((await db.emailDelivery.findUniqueOrThrow({ where: { id: deliveryId } })).status).toBe(
      "sending"
    );
  });
  it("evidence-based reconciliation permits exactly one retry and rejects stale evidence", async () => {
    provider.send.mockRejectedValueOnce(new Error("connection lost"));
    await expect(retryContentfulCampaign({ campaignId })).rejects.toThrow();
    const evidence = {
      campaignId,
      actorUserId: actorId,
      resolution: "confirm_not_sent" as const,
      deliveries: [{ id: deliveryId, attemptCount: 1 }],
      note: "Fixture provider log confirms not sent",
    };
    await reconcileContentfulCampaign(evidence);
    await expect(reconcileContentfulCampaign(evidence)).rejects.toThrow(
      "CAMPAIGN_RECONCILIATION_NOT_REQUIRED"
    );
    await retryContentfulCampaign({ campaignId });
    expect(provider.send).toHaveBeenCalledTimes(2);
    expect(await db.emailDeliveryAttempt.count({ where: { deliveryId } })).toBe(2);
  });
  it("an expired worker lease does not make an in-flight delivery safe to resend", async () => {
    await db.emailCampaign.update({
      where: { id: campaignId },
      data: { processingToken: "crashed", processingLeaseExpiresAt: new Date(0) },
    });
    await db.emailDelivery.update({
      where: { id: deliveryId },
      data: { status: "sending", attemptCount: 1 },
    });
    await expect(retryContentfulCampaign({ campaignId })).rejects.toThrow(
      "CAMPAIGN_RECONCILIATION_REQUIRED"
    );
    expect(provider.send).not.toHaveBeenCalled();
  });
});
