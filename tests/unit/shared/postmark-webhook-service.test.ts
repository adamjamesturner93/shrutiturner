import { beforeEach, describe, expect, it, vi } from "vitest";

const userFindUniqueMock = vi.fn();
const emailDeliveryFindUniqueMock = vi.fn();
const emailDeliveryFindFirstMock = vi.fn();
const emailDeliveryUpdateManyMock = vi.fn();
const emailCampaignFindUniqueMock = vi.fn();
const emailEventUpsertMock = vi.fn();
const newsletterSubscriberFindUniqueMock = vi.fn();
const newsletterSubscriberUpdateMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: userFindUniqueMock,
    },
    emailDelivery: {
      findUnique: emailDeliveryFindUniqueMock,
      findFirst: emailDeliveryFindFirstMock,
      updateMany: emailDeliveryUpdateManyMock,
    },
    emailCampaign: {
      findUnique: emailCampaignFindUniqueMock,
    },
    emailEvent: {
      upsert: emailEventUpsertMock,
    },
    newsletterSubscriber: {
      findUnique: newsletterSubscriberFindUniqueMock,
      update: newsletterSubscriberUpdateMock,
    },
  },
}));

const { ingestPostmarkEvent } = await import("@/lib/postmark/webhook-service");

describe("ingestPostmarkEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindUniqueMock.mockResolvedValue({ id: "user_123" });
    emailDeliveryFindUniqueMock.mockResolvedValue(null);
    emailDeliveryFindFirstMock.mockResolvedValue(null);
    emailDeliveryUpdateManyMock.mockResolvedValue({ count: 0 });
    emailCampaignFindUniqueMock.mockResolvedValue(null);
    emailEventUpsertMock.mockResolvedValue(undefined);
    newsletterSubscriberFindUniqueMock.mockResolvedValue(null);
    newsletterSubscriberUpdateMock.mockResolvedValue(undefined);
  });

  it("links events to a delivery via metadata and inherits the delivery campaign", async () => {
    emailDeliveryFindUniqueMock.mockResolvedValue({
      id: "delivery_123",
      campaignId: "campaign_123",
    });

    await ingestPostmarkEvent({
      ID: 1001,
      RecordType: "Delivered",
      MessageID: "message_123",
      Recipient: "Reader@Example.com",
      Subject: "Your studio account is ready",
      Metadata: {
        deliveryId: "delivery_123",
      },
    });

    expect(emailEventUpsertMock).toHaveBeenCalledWith({
      where: { providerEventId: "1001" },
      create: expect.objectContaining({
        email: "reader@example.com",
        userId: "user_123",
        deliveryId: "delivery_123",
        campaignId: "campaign_123",
        messageId: "message_123",
        type: "delivered",
      }),
      update: expect.objectContaining({
        deliveryId: "delivery_123",
        campaignId: "campaign_123",
      }),
    });
  });

  it("falls back to provider message id when delivery metadata is missing", async () => {
    emailDeliveryFindFirstMock.mockResolvedValue({
      id: "delivery_456",
      campaignId: null,
    });

    await ingestPostmarkEvent({
      ID: 1002,
      RecordType: "Open",
      MessageID: "message_456",
      Recipient: "reader@example.com",
      Metadata: {},
    });

    expect(emailDeliveryFindUniqueMock).not.toHaveBeenCalled();
    expect(emailDeliveryFindFirstMock).toHaveBeenCalledWith({
      where: { providerMessageId: "message_456" },
      select: { id: true, campaignId: true },
    });
    expect(emailEventUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          deliveryId: "delivery_456",
          messageId: "message_456",
          type: "opened",
        }),
        update: expect.objectContaining({
          deliveryId: "delivery_456",
        }),
      })
    );
  });

  it("suppresses subscribers when Postmark reports unsubscribe events", async () => {
    newsletterSubscriberFindUniqueMock.mockResolvedValue({
      id: "subscriber_123",
      userId: "user_123",
    });

    await ingestPostmarkEvent({
      ID: 1003,
      RecordType: "SubscriptionChange",
      MessageID: "message_789",
      Recipient: "reader@example.com",
      Metadata: {},
    });

    expect(emailEventUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          type: "unsubscribed",
        }),
      })
    );
    expect(newsletterSubscriberUpdateMock).toHaveBeenCalledWith({
      where: { id: "subscriber_123" },
      data: expect.objectContaining({
        status: "unsubscribed",
        verificationTokenHash: null,
        verificationTokenExpiresAt: null,
      }),
    });
    expect(emailDeliveryUpdateManyMock).toHaveBeenCalledWith({
      where: {
        toEmail: "reader@example.com",
        category: "marketing",
        resolvedAt: null,
        status: { in: ["failed", "dead_letter"] },
      },
      data: expect.objectContaining({
        resolutionCode: "recipient_suppressed",
        retryable: false,
        nextRetryAt: null,
      }),
    });
  });
});
