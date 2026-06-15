import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

process.env.POSTMARK_API_TOKEN = "postmark-token";
process.env.POSTMARK_FROM_EMAIL = "Shruti Turner <hello@example.com>";
process.env.NEXT_PUBLIC_SITE_URL = "https://shrutiturner.co.uk";

const sendEmailBatchMock = vi.fn();
const getEntriesMock = vi.fn();

vi.mock("postmark", () => ({
  ServerClient: vi.fn(function ServerClient() {
    return {
      sendEmailBatch: sendEmailBatchMock,
    };
  }),
}));

vi.mock("@/lib/content/contentful-client", () => ({
  getEntries: getEntriesMock,
}));

const { db } = await import("@/lib/db");
const { triggerContentfulPublishCampaign } = await import("@/lib/newsletter/campaign-automation");
const { ingestPostmarkEvent } = await import("@/lib/postmark/webhook-service");
const { getAdminNewsletterSummary } = await import("@/lib/admin/newsletter-service");

const EMAIL_PREFIX = "integration-campaign-";
const CONTENTFUL_ENTRY_ID = "integration_entry_123";
const CONTENTFUL_VERSION = "integration";

function makeEmail(label: string) {
  return `${EMAIL_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function cleanupTestRows() {
  const campaigns = await db.emailCampaign.findMany({
    where: {
      OR: [
        { contentfulEntryId: CONTENTFUL_ENTRY_ID },
        { providerCampaignId: { contains: CONTENTFUL_VERSION } },
      ],
    },
    select: { id: true },
  });
  const campaignIds = campaigns.map((campaign) => campaign.id);
  const emailEventWhere = [
    { email: { startsWith: EMAIL_PREFIX } },
    ...(campaignIds.length ? [{ campaignId: { in: campaignIds } }] : []),
  ];
  const deliveryWhere = [
    { toEmail: { startsWith: EMAIL_PREFIX } },
    ...(campaignIds.length ? [{ campaignId: { in: campaignIds } }] : []),
  ];

  await db.emailEvent.deleteMany({
    where: {
      OR: emailEventWhere,
    },
  });
  await db.emailDeliveryAttempt.deleteMany({
    where: {
      delivery: {
        OR: deliveryWhere,
      },
    },
  });
  await db.emailDelivery.deleteMany({
    where: {
      OR: deliveryWhere,
    },
  });
  await db.emailCampaign.deleteMany({
    where: {
      OR: [
        { contentfulEntryId: CONTENTFUL_ENTRY_ID },
        { providerCampaignId: { contains: CONTENTFUL_VERSION } },
      ],
    },
  });
  await db.newsletterSubscriber.deleteMany({
    where: {
      email: {
        startsWith: EMAIL_PREFIX,
      },
    },
  });
  await db.userNotificationPreference.deleteMany({
    where: {
      user: {
        email: {
          startsWith: EMAIL_PREFIX,
        },
      },
    },
  });
  await db.user.deleteMany({
    where: {
      email: {
        startsWith: EMAIL_PREFIX,
      },
    },
  });
}

describe("newsletter campaign reporting integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupTestRows();

    getEntriesMock.mockResolvedValue({
      items: [
        {
          sys: { id: "entry_123" },
          fields: {
            slug: "integration-newsletter",
            title: "Integration newsletter",
            subject: "Integration newsletter",
            body: "A test campaign body.",
          },
        },
      ],
    });
    sendEmailBatchMock.mockImplementation(
      (
        messages: Array<{
          To: string;
        }>
      ) =>
        messages.map((message, index) => ({
          ErrorCode: 0,
          MessageID: message.To.startsWith(EMAIL_PREFIX) ? "message_123" : `message_${index}`,
        }))
    );
  });

  afterAll(async () => {
    await cleanupTestRows();
  });

  it("persists campaign deliveries and links Postmark events into admin reporting", async () => {
    const email = makeEmail("recipient");
    const user = await db.user.create({
      data: {
        email,
        firstName: "Campaign",
      },
    });
    await db.newsletterSubscriber.create({
      data: {
        email,
        firstName: "Campaign",
        userId: user.id,
        source: "landing-page",
        status: "subscribed",
        token: `tok_${Date.now()}_campaign`,
        verifiedAt: new Date(),
      },
    });

    const result = await triggerContentfulPublishCampaign({
      contentType: "newsletterTemplate",
      contentfulEntryId: CONTENTFUL_ENTRY_ID,
      contentfulVersion: CONTENTFUL_VERSION,
    });

    expect(result.skipped).toBe(false);

    const campaign = await db.emailCampaign.findFirstOrThrow({
      where: {
        contentfulEntryId: CONTENTFUL_ENTRY_ID,
        providerCampaignId: {
          contains: "integration",
        },
      },
      include: {
        emailDeliveries: {
          include: {
            attempts: true,
          },
        },
      },
    });
    const delivery = campaign.emailDeliveries.find((item) => item.toEmail === email);

    expect(campaign.sentCount).toBeGreaterThanOrEqual(1);
    expect(campaign.failedCount).toBe(0);
    expect(campaign.status).toBe("sent");
    expect(delivery).toMatchObject({
      toEmail: email,
      campaignId: campaign.id,
      category: "marketing",
      templateKey: "contentful-newsletterTemplate",
      providerMessageId: "message_123",
      status: "sent",
    });
    expect(delivery?.attempts[0]).toMatchObject({
      attemptNumber: 1,
      providerMessageId: "message_123",
      status: "sent",
    });
    const sentBatch = sendEmailBatchMock.mock.calls[0]?.[0] ?? [];
    const sentMessage = sentBatch.find((message) => message.To === email);

    expect(sentMessage).toMatchObject({
      Metadata: expect.objectContaining({
        campaignId: campaign.id,
        deliveryId: delivery?.id,
      }),
      TextBody: expect.stringContaining("/unsubscribe?token="),
    });

    await ingestPostmarkEvent({
      ID: 9001,
      RecordType: "Open",
      MessageID: "message_123",
      Recipient: email,
      Metadata: {
        deliveryId: delivery?.id,
        campaignId: campaign.id,
      },
    });
    await ingestPostmarkEvent({
      ID: 9002,
      RecordType: "Click",
      MessageID: "message_123",
      Recipient: email,
      OriginalLink: "https://shrutiturner.co.uk/blog",
      Metadata: {
        deliveryId: delivery?.id,
        campaignId: campaign.id,
      },
    });

    const summary = await getAdminNewsletterSummary();
    const campaignSummary = summary.campaigns.find((item) => item.id === campaign.id);
    const source = summary.sourceAttribution.find((item) => item.source === "landing-page");

    expect(campaignSummary).toMatchObject({
      id: campaign.id,
      opened: 1,
      clicked: 1,
      totalRecipients: expect.any(Number),
    });
    expect(source).toMatchObject({
      source: "landing-page",
      subscribed: expect.any(Number),
      total: expect.any(Number),
    });
  });
});
