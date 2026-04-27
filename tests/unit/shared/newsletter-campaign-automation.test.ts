import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmailBatchMock = vi.fn();
const emailCampaignFindUniqueMock = vi.fn();
const emailCampaignFindManyMock = vi.fn();
const emailCampaignCreateMock = vi.fn();
const emailCampaignUpdateMock = vi.fn();
const newsletterSubscriberFindManyMock = vi.fn();
const emailDeliveryCreateMock = vi.fn();
const emailDeliveryUpdateMock = vi.fn();
const emailDeliveryAttemptCreateMock = vi.fn();
const getEntriesMock = vi.fn();

vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<html>Email</html>"),
}));

vi.mock("postmark", () => ({
  ServerClient: vi.fn(function ServerClient() {
    return {
      sendEmailBatch: sendEmailBatchMock,
    };
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    emailCampaign: {
      findUnique: emailCampaignFindUniqueMock,
      findMany: emailCampaignFindManyMock,
      create: emailCampaignCreateMock,
      update: emailCampaignUpdateMock,
    },
    newsletterSubscriber: {
      findMany: newsletterSubscriberFindManyMock,
    },
    emailDelivery: {
      create: emailDeliveryCreateMock,
      update: emailDeliveryUpdateMock,
    },
    emailDeliveryAttempt: {
      create: emailDeliveryAttemptCreateMock,
    },
  },
}));

vi.mock("@/lib/content/contentful-client", () => ({
  getEntries: getEntriesMock,
}));

vi.mock("@/lib/env", () => ({
  getBaseSiteUrlFromEnv: () => "https://shrutiturner.test",
  getPostmarkToken: () => "postmark-token",
}));

vi.mock("@/lib/postmark/client", () => ({
  getPostmarkMessageStream: () => "broadcast",
}));

vi.mock("@/lib/newsletter/tokens", () => ({
  createSignedUnsubscribeToken: (subscriberId: string) => `signed-${subscriberId}`,
}));

vi.mock("@/lib/admin/action-log-service", () => ({
  createAdminActionLog: vi.fn(),
}));

const { processDueContentfulCampaigns, triggerContentfulPublishCampaign } =
  await import("@/lib/newsletter/campaign-automation");

describe("triggerContentfulPublishCampaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.POSTMARK_FROM_EMAIL = "Shruti <hello@example.com>";
    emailCampaignFindUniqueMock.mockResolvedValue(null);
    emailCampaignFindManyMock.mockResolvedValue([]);
    emailCampaignCreateMock.mockResolvedValue({
      id: "campaign_123",
    });
    emailCampaignUpdateMock.mockResolvedValue({
      id: "campaign_123",
      status: "sent",
    });
    getEntriesMock.mockResolvedValue({
      items: [
        {
          sys: { id: "entry_123" },
          fields: {
            slug: "april-newsletter",
            title: "April newsletter",
            subject: "April newsletter",
            body: "This month in the studio.",
          },
        },
      ],
    });
    newsletterSubscriberFindManyMock.mockResolvedValue([
      {
        id: "subscriber_1",
        email: "Reader@Example.com",
        firstName: "Rhea",
        userId: "user_1",
        user: { firstName: "Rhea" },
      },
    ]);
    emailDeliveryCreateMock.mockResolvedValue({ id: "delivery_1" });
    emailDeliveryUpdateMock.mockResolvedValue({ id: "delivery_1" });
    emailDeliveryAttemptCreateMock.mockResolvedValue({ id: "attempt_1" });
    sendEmailBatchMock.mockResolvedValue([{ ErrorCode: 0, MessageID: "message_1" }]);
  });

  it("sends Contentful newsletters to subscribed newsletter recipients with delivery metadata", async () => {
    await expect(
      triggerContentfulPublishCampaign({
        contentType: "newsletterTemplate",
        contentfulEntryId: "entry_123",
        contentfulVersion: "9",
      })
    ).resolves.toEqual({ skipped: false, campaignId: "campaign_123" });

    expect(newsletterSubscriberFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "subscribed",
        }),
      })
    );
    expect(emailDeliveryCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          toEmail: "reader@example.com",
          campaignId: "campaign_123",
          category: "marketing",
          templateKey: "contentful-newsletterTemplate",
        }),
      })
    );
    expect(sendEmailBatchMock).toHaveBeenCalledWith([
      expect.objectContaining({
        To: "reader@example.com",
        MessageStream: "broadcast",
        Metadata: expect.objectContaining({
          campaignId: "campaign_123",
          deliveryId: "delivery_1",
          subscriberId: "subscriber_1",
        }),
        TextBody: expect.stringContaining(
          "https://shrutiturner.test/unsubscribe?token=signed-subscriber_1"
        ),
      }),
    ]);
    expect(emailDeliveryUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "delivery_1" },
        data: expect.objectContaining({
          providerMessageId: "message_1",
        }),
      })
    );
    expect(emailDeliveryAttemptCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deliveryId: "delivery_1",
          providerMessageId: "message_1",
        }),
      })
    );
  });

  it("records a scheduled campaign without sending when the Contentful send date is in the future", async () => {
    getEntriesMock.mockResolvedValue({
      items: [
        {
          sys: { id: "entry_123" },
          fields: {
            title: "May newsletter",
            subject: "May newsletter",
            body: "Scheduled update.",
            status: "scheduled",
            sendDate: "2026-05-15T10:00:00.000Z",
          },
        },
      ],
    });

    await expect(
      triggerContentfulPublishCampaign({
        contentType: "newsletterTemplate",
        contentfulEntryId: "entry_123",
        contentfulVersion: "10",
        now: new Date("2026-05-01T10:00:00.000Z"),
      })
    ).resolves.toEqual({
      skipped: true,
      reason: "scheduled_for_future",
      campaignId: "campaign_123",
    });

    expect(emailCampaignCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "scheduled",
          scheduledAt: new Date("2026-05-15T10:00:00.000Z"),
        }),
      })
    );
    expect(sendEmailBatchMock).not.toHaveBeenCalled();
  });

  it("skips draft or test-mode newsletter templates before creating a campaign", async () => {
    getEntriesMock.mockResolvedValue({
      items: [
        {
          sys: { id: "entry_123" },
          fields: {
            title: "Draft newsletter",
            subject: "Draft newsletter",
            body: "Not ready.",
            status: "draft",
          },
        },
      ],
    });

    await expect(
      triggerContentfulPublishCampaign({
        contentType: "newsletterTemplate",
        contentfulEntryId: "entry_123",
      })
    ).resolves.toEqual({ skipped: true, reason: "draft_status" });

    expect(emailCampaignCreateMock).not.toHaveBeenCalled();
    expect(sendEmailBatchMock).not.toHaveBeenCalled();
  });

  it("processes due scheduled Contentful campaigns", async () => {
    emailCampaignFindManyMock.mockResolvedValue([
      {
        id: "campaign_123",
        contentfulEntryId: "entry_123",
        contentfulContentType: "newsletterTemplate",
        audienceType: "newsletter",
      },
    ]);

    await expect(
      processDueContentfulCampaigns(new Date("2026-05-15T10:00:00.000Z"))
    ).resolves.toEqual({
      ok: true,
      scanned: 1,
      processed: 1,
      failed: 0,
    });

    expect(emailCampaignFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "scheduled",
          scheduledAt: { lte: new Date("2026-05-15T10:00:00.000Z") },
        }),
      })
    );
    expect(sendEmailBatchMock).toHaveBeenCalledTimes(1);
  });
});
