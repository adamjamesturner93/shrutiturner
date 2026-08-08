import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const newsletterSubscriberCountMock = vi.fn();
const newsletterSubscriberGroupByMock = vi.fn();
const newsletterSubscriberFindManyMock = vi.fn();
const emailEventFindManyMock = vi.fn();
const emailCampaignCountMock = vi.fn();
const emailCampaignFindManyMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    newsletterSubscriber: {
      count: newsletterSubscriberCountMock,
      groupBy: newsletterSubscriberGroupByMock,
      findMany: newsletterSubscriberFindManyMock,
    },
    emailEvent: {
      findMany: emailEventFindManyMock,
    },
    emailCampaign: {
      count: emailCampaignCountMock,
      findMany: emailCampaignFindManyMock,
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/admin/action-log-service", () => ({
  createAdminActionLog: vi.fn(),
}));

vi.mock("@/lib/newsletter/subscriber-service", () => ({
  syncMarketingPreferenceForUser: vi.fn(),
}));

const { getAdminNewsletterSummary } = await import("@/lib/admin/newsletter-service");

describe("admin newsletter reporting service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-27T12:00:00.000Z"));
    newsletterSubscriberCountMock.mockResolvedValue(0);
    newsletterSubscriberGroupByMock.mockResolvedValue([]);
    newsletterSubscriberFindManyMock.mockResolvedValue([
      {
        status: "subscribed",
        source: "landing-page",
        createdAt: new Date("2026-04-26T08:00:00.000Z"),
        verifiedAt: new Date("2026-04-26T08:05:00.000Z"),
        unsubscribedAt: null,
      },
    ]);
    emailEventFindManyMock.mockResolvedValue([
      { type: "Bounce", eventAt: new Date("2026-04-26T09:00:00.000Z") },
      { type: "SpamComplaint", eventAt: new Date("2026-04-26T09:05:00.000Z") },
    ]);
    emailCampaignCountMock.mockResolvedValue(1);
    emailCampaignFindManyMock.mockResolvedValue([
      {
        id: "campaign_123",
        providerCampaignId: "provider_123",
        subject: "April newsletter",
        status: "failed_partial",
        audienceType: "subscribers",
        triggeredBy: "contentful_publish",
        contentfulEntryId: "entry_123",
        sentCount: 95,
        failedCount: 5,
        stream: "broadcast",
        errorSummary: "One recipient is inactive in Postmark.",
        sentAt: new Date("2026-04-26T09:00:00.000Z"),
        scheduledAt: null,
        createdAt: new Date("2026-04-26T08:00:00.000Z"),
        emailEvents: [
          { type: "Delivery", metadataJson: null },
          { type: "Open", metadataJson: null },
          { type: "Click", metadataJson: { url: "https://example.com" } },
          { type: "Bounce", metadataJson: null },
          { type: "SpamComplaint", metadataJson: null },
          { type: "Unsubscribe", metadataJson: null },
        ],
        emailDeliveries: [
          {
            status: "failed",
            messageStream: "broadcast",
            lastError: "One recipient is inactive in Postmark.",
            resolvedAt: null,
          },
        ],
      },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("filters, paginates and derives campaign reporting rates", async () => {
    const summary = await getAdminNewsletterSummary({
      campaignStatus: "failed_partial",
      campaignDateRange: "7d",
      campaignPage: 2,
      campaignPageSize: 10,
      audienceDateRange: "7d",
      audienceSource: "landing-page",
    });

    expect(emailCampaignFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "failed_partial",
          OR: expect.any(Array),
        }),
        skip: 10,
        take: 10,
      })
    );
    expect(summary.campaignsPagination).toEqual({
      page: 2,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
    expect(summary.campaigns[0]).toMatchObject({
      id: "campaign_123",
      status: "failed_partial",
      failedSends: 5,
      sourceSystem: "Contentful",
      delivered: 95,
      deliveryRate: 95,
      bounceRate: 1,
      complaintRate: 1,
      unsubscribeRate: 1,
      messageStream: "broadcast",
      attentionReasons: ["5 recipients failed", "1 spam complaint"],
      errorSummary: "One recipient is inactive in Postmark.",
    });
    expect(summary.audienceReporting.source).toBe("landing-page");
    expect(summary.audienceReporting.sourceSegments[0]).toMatchObject({
      source: "landing-page",
      newSubscribers: 1,
      verifiedSubscribers: 1,
      netGrowth: 1,
    });
    expect(summary.audienceReporting.trend.find((row) => row.date === "2026-04-26")).toMatchObject({
      newSubscribers: 1,
      verifiedSubscribers: 1,
      bounces: 1,
      spamComplaints: 1,
    });
  });
});
