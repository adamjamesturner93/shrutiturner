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

  it("sends newly published blog posts once with a New blog post subject and excerpt", async () => {
    getEntriesMock.mockResolvedValue({
      items: [
        {
          sys: { id: "blog_123" },
          fields: {
            title: "Training Around Flares",
            slug: "training-around-flares",
            excerpt:
              "A practical article about adapting training around flare days without turning every week into a full restart.",
          },
        },
      ],
    });

    await expect(
      triggerContentfulPublishCampaign({
        contentType: "blogPost",
        contentfulEntryId: "blog_123",
        contentfulVersion: "7",
      })
    ).resolves.toEqual({ skipped: false, campaignId: "campaign_123" });

    expect(emailCampaignFindUniqueMock).toHaveBeenCalledWith({
      where: { providerCampaignId: "contentful:blogPost:blog_123:blog" },
      select: { id: true, status: true },
    });
    expect(emailCampaignCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerCampaignId: "contentful:blogPost:blog_123:blog",
          subject: "New blog post: Training Around Flares",
          audienceType: "blog",
        }),
      })
    );
    expect(emailDeliveryCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subject: "New blog post: Training Around Flares",
          templateKey: "contentful-blogPost",
          payloadJson: expect.objectContaining({
            textBody: expect.stringContaining(
              "A practical article about adapting training around flare days"
            ),
          }),
        }),
      })
    );
    expect(sendEmailBatchMock).toHaveBeenCalledWith([
      expect.objectContaining({
        Subject: "New blog post: Training Around Flares",
        TextBody: expect.stringContaining("https://shrutiturner.test/blog/training-around-flares"),
      }),
    ]);
  });

  it("does not resend a blog campaign when the same post is republished with a new Contentful version", async () => {
    emailCampaignFindUniqueMock.mockResolvedValueOnce({
      id: "campaign_sent",
      status: "sent",
    });
    getEntriesMock.mockResolvedValue({
      items: [
        {
          sys: { id: "blog_123" },
          fields: {
            title: "Training Around Flares",
            slug: "training-around-flares",
            excerpt: "Updated excerpt.",
          },
        },
      ],
    });

    await expect(
      triggerContentfulPublishCampaign({
        contentType: "blogPost",
        contentfulEntryId: "blog_123",
        contentfulVersion: "8",
      })
    ).resolves.toEqual({
      skipped: true,
      reason: "already_sent",
      campaignId: "campaign_sent",
    });

    expect(emailCampaignFindUniqueMock).toHaveBeenCalledWith({
      where: { providerCampaignId: "contentful:blogPost:blog_123:blog" },
      select: { id: true, status: true },
    });
    expect(emailCampaignCreateMock).not.toHaveBeenCalled();
    expect(sendEmailBatchMock).not.toHaveBeenCalled();
  });

  it("sends a newsletter when Contentful publishes it without status or test-mode gates", async () => {
    getEntriesMock.mockResolvedValue({
      items: [
        {
          sys: { id: "entry_123" },
          fields: {
            title: "Published newsletter",
            subject: "Published newsletter",
            body: "Ready to send.",
          },
        },
      ],
    });

    await expect(
      triggerContentfulPublishCampaign({
        contentType: "newsletterTemplate",
        contentfulEntryId: "entry_123",
        contentfulVersion: "10",
      })
    ).resolves.toEqual({ skipped: false, campaignId: "campaign_123" });

    expect(emailCampaignCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "sending",
        }),
      })
    );
    expect(sendEmailBatchMock).toHaveBeenCalledTimes(1);
  });

  it("skips newsletter templates that are missing required send fields", async () => {
    getEntriesMock.mockResolvedValue({
      items: [
        {
          sys: { id: "entry_123" },
          fields: {
            title: "Incomplete newsletter",
            subject: "Incomplete newsletter",
          },
        },
      ],
    });

    await expect(
      triggerContentfulPublishCampaign({
        contentType: "newsletterTemplate",
        contentfulEntryId: "entry_123",
      })
    ).resolves.toEqual({ skipped: true, reason: "missing_required_fields" });

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
