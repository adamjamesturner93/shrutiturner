import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmailBatchMock = vi.fn();
const renderMock = vi.fn();
const emailCampaignFindUniqueMock = vi.fn();
const emailCampaignFindFirstMock = vi.fn();
const emailCampaignFindManyMock = vi.fn();
const emailCampaignCreateMock = vi.fn();
const emailCampaignUpdateMock = vi.fn();
const emailCampaignUpdateManyMock = vi.fn();
const newsletterSubscriberFindManyMock = vi.fn();
const emailDeliveryCreateMock = vi.fn();
const emailDeliveryUpdateMock = vi.fn();
const emailDeliveryUpdateManyMock = vi.fn();
const emailDeliveryFindManyMock = vi.fn();
const emailDeliveryCountMock = vi.fn();
const emailDeliveryGroupByMock = vi.fn();
const emailDeliveryAttemptCreateMock = vi.fn();
const emailDeliveryAttemptUpdateMock = vi.fn();
const emailDeliveryAttemptUpdateManyMock = vi.fn();
const getEntriesMock = vi.fn();

vi.mock("@react-email/render", () => ({
  render: renderMock,
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
      findFirst: emailCampaignFindFirstMock,
      findMany: emailCampaignFindManyMock,
      create: emailCampaignCreateMock,
      update: emailCampaignUpdateMock,
      updateMany: emailCampaignUpdateManyMock,
    },
    newsletterSubscriber: {
      findMany: newsletterSubscriberFindManyMock,
    },
    emailDelivery: {
      create: emailDeliveryCreateMock,
      upsert: ({ create }: { create: Record<string, unknown> }) => emailDeliveryCreateMock({ data: create }),
      update: emailDeliveryUpdateMock,
      updateMany: emailDeliveryUpdateManyMock,
      findMany: emailDeliveryFindManyMock,
      count: emailDeliveryCountMock,
      groupBy: emailDeliveryGroupByMock,
    },
    emailDeliveryAttempt: {
      create: emailDeliveryAttemptCreateMock,
      update: emailDeliveryAttemptUpdateMock,
      updateMany: emailDeliveryAttemptUpdateManyMock,
    },
    $transaction: vi.fn(async (operations: Array<Promise<unknown>> | ((tx: unknown) => Promise<unknown>)) => {
      if (typeof operations === "function") return operations((await import("@/lib/db")).db);
      return Promise.all(operations);
    }),
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

const {
  processDueContentfulCampaigns,
  reconcileContentfulCampaign,
  triggerContentfulPublishCampaign,
  retryContentfulCampaign,
} = await import("@/lib/newsletter/campaign-automation");

describe("triggerContentfulPublishCampaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderMock.mockResolvedValue("<html>Email</html>");
    process.env.POSTMARK_FROM_EMAIL = "Shruti <hello@example.com>";
    process.env.CONTENTFUL_SPACE_ID = "space_test";
    process.env.CONTENTFUL_ENVIRONMENT = "sandbox";
    emailCampaignFindUniqueMock.mockResolvedValue(null);
    emailCampaignUpdateManyMock.mockResolvedValue({ count: 1 });
    emailCampaignFindFirstMock.mockResolvedValue(null);
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
    emailDeliveryCreateMock.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      id: "delivery_1",
      toEmail: data.toEmail,
      subject: data.subject,
      tag: data.tag,
      messageStream: data.messageStream,
      payloadJson: data.payloadJson,
      metadataJson: data.metadataJson,
      attemptCount: 0,
    }));
    emailDeliveryUpdateMock.mockResolvedValue({ id: "delivery_1" });
    emailDeliveryUpdateManyMock.mockResolvedValue({ count: 1 });
    emailDeliveryFindManyMock.mockResolvedValue([]);
    emailDeliveryCountMock.mockResolvedValue(0);
    emailDeliveryGroupByMock.mockResolvedValue([{ status: "sent", _count: { _all: 1 } }]);
    emailDeliveryAttemptCreateMock.mockResolvedValue({ id: "attempt_1" });
    emailDeliveryAttemptUpdateMock.mockResolvedValue({ id: "attempt_1" });
    emailDeliveryAttemptUpdateManyMock.mockResolvedValue({ count: 1 });
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
          status: "started",
        }),
      })
    );
    expect(emailDeliveryAttemptUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ providerMessageId: "message_1" }),
      })
    );
  });

  it("renders Contentful preview text and embedded assets into newsletter deliveries", async () => {
    getEntriesMock.mockResolvedValue({
      items: [
        {
          sys: { id: "entry_123" },
          fields: {
            title: "Routine update",
            subject: "Your routine is allowed to change.",
            previewText: "Adapting your movement is not giving up.",
            content: {
              nodeType: "document",
              data: {},
              content: [
                {
                  nodeType: "paragraph",
                  data: {},
                  content: [
                    {
                      nodeType: "text",
                      value: "Hello from Contentful.",
                      marks: [],
                      data: {},
                    },
                  ],
                },
                {
                  nodeType: "embedded-asset-block",
                  data: { target: { sys: { id: "asset_123" } } },
                  content: [],
                },
              ],
            },
          },
        },
      ],
      includes: {
        Asset: [
          {
            sys: { id: "asset_123" },
            fields: {
              title: { "en-GB": "Bonnie stretch" },
              file: { "en-GB": { url: "//images.ctfassets.net/example/bonnie.jpg" } },
            },
          },
        ],
      },
    });

    await triggerContentfulPublishCampaign({
      contentType: "newsletterTemplate",
      contentfulEntryId: "entry_123",
      contentfulVersion: "11",
    });

    expect(emailDeliveryCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          payloadJson: expect.objectContaining({
            textBody: expect.stringContaining(
              "![Bonnie stretch](https://images.ctfassets.net/example/bonnie.jpg)"
            ),
          }),
        }),
      })
    );
    expect(sendEmailBatchMock).toHaveBeenCalledWith([
      expect.objectContaining({
        TextBody: expect.stringContaining("Adapting your movement is not giving up."),
      }),
    ]);
  });

  it("renders an embedded asset when Contentful resolves it directly on the rich-text node", async () => {
    getEntriesMock.mockResolvedValue({
      items: [
        {
          sys: { id: "entry_123" },
          fields: {
            title: "Routine update",
            subject: "Your routine is allowed to change.",
            content: {
              nodeType: "document",
              data: {},
              content: [
                {
                  nodeType: "embedded-asset-block",
                  data: {
                    target: {
                      sys: { id: "asset_inline" },
                      fields: {
                        title: "Bonnie stretch",
                        file: { url: "//images.ctfassets.net/example/bonnie-inline.jpg" },
                      },
                    },
                  },
                  content: [],
                },
              ],
            },
          },
        },
      ],
    });

    await triggerContentfulPublishCampaign({
      contentType: "newsletterTemplate",
      contentfulEntryId: "entry_123",
      contentfulVersion: "12",
    });

    expect(emailDeliveryCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          payloadJson: expect.objectContaining({
            textBody: expect.stringContaining(
              "![Bonnie stretch](https://images.ctfassets.net/example/bonnie-inline.jpg)"
            ),
          }),
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
      where: { sourceIssueKey: "contentful:space_test:sandbox:blogPost:blog_123" },
      select: { id: true, status: true },
    });
    expect(emailCampaignFindFirstMock).toHaveBeenCalledWith({
      where: {
        contentfulEntryId: "blog_123",
        contentfulContentType: "blogPost",
        audienceType: "blog",
      },
      orderBy: { createdAt: "asc" },
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
        TextBody: expect.stringContaining(
          "I've just published a new post on my blog I thought you'd be interested in."
        ),
      }),
    ]);
    expect(sendEmailBatchMock).toHaveBeenCalledWith([
      expect.objectContaining({
        TextBody: expect.stringContaining("Hope you enjoy,\nShruti"),
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
      where: { sourceIssueKey: "contentful:space_test:sandbox:blogPost:blog_123" },
      select: { id: true, status: true },
    });
    expect(emailCampaignCreateMock).not.toHaveBeenCalled();
    expect(sendEmailBatchMock).not.toHaveBeenCalled();
  });

  it("does not resend a blog campaign while a previous publish event is still sending", async () => {
    emailCampaignFindUniqueMock.mockResolvedValueOnce({
      id: "campaign_sending",
      status: "sending",
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
      reason: "already_sending",
      campaignId: "campaign_sending",
    });

    expect(emailCampaignCreateMock).not.toHaveBeenCalled();
    expect(emailCampaignUpdateMock).not.toHaveBeenCalled();
    expect(sendEmailBatchMock).not.toHaveBeenCalled();
  });

  it("requires an explicit provider outcome before ambiguous deliveries can be retried", async () => {
    emailCampaignFindUniqueMock.mockResolvedValueOnce({
      id: "campaign_123",
      status: "reconciliation_required",
      sentCount: 1,
      failedCount: 0,
      errorSummary: "Provider response was interrupted",
      contentfulEntryId: "entry_123",
    });
    emailDeliveryFindManyMock.mockResolvedValueOnce([{ id: "delivery_unknown" }]);
    emailDeliveryGroupByMock.mockResolvedValueOnce([
      { status: "sent", _count: { _all: 1 } },
      { status: "failed", _count: { _all: 1 } },
    ]);

    await expect(
      reconcileContentfulCampaign({
        campaignId: "campaign_123",
        resolution: "confirm_not_sent",
        deliveries: [{ id: "delivery_unknown", attemptCount: 1 }],
        note: "Checked Postmark outbound search for this recipient and attempt.",
        actorUserId: "admin_1",
      })
    ).resolves.toMatchObject({
      campaignId: "campaign_123",
      resolution: "confirm_not_sent",
      reconciledCount: 1,
      status: "failed_partial",
    });

    expect(emailDeliveryUpdateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ["delivery_unknown"] } }),
        data: expect.objectContaining({ status: "failed", retryable: true }),
      })
    );
    expect(emailDeliveryAttemptUpdateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "failed" }),
      })
    );
    expect(sendEmailBatchMock).not.toHaveBeenCalled();
  });

  it("does not resend a republished blog post when an earlier campaign exists for the entry id", async () => {
    emailCampaignFindUniqueMock.mockResolvedValueOnce(null);
    emailCampaignFindFirstMock.mockResolvedValueOnce({
      id: "campaign_by_entry",
      status: "sent",
    });
    getEntriesMock.mockResolvedValue({
      items: [
        {
          sys: { id: "blog_123" },
          fields: {
            title: "Training Around Flares",
            slug: "training-around-flares",
            excerpt: "Edited excerpt after publish.",
          },
        },
      ],
    });

    await expect(
      triggerContentfulPublishCampaign({
        contentType: "blogPost",
        contentfulEntryId: "blog_123",
        contentfulVersion: "9",
      })
    ).resolves.toEqual({
      skipped: true,
      reason: "already_sent",
      campaignId: "campaign_by_entry",
    });

    expect(emailCampaignCreateMock).not.toHaveBeenCalled();
    expect(emailCampaignUpdateMock).toHaveBeenCalledWith({
      where: { id: "campaign_by_entry" },
      data: { sourceIssueKey: "contentful:space_test:sandbox:blogPost:blog_123" },
    });
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
          status: "preparing",
        }),
      })
    );
    expect(sendEmailBatchMock).toHaveBeenCalledTimes(1);
  });

  it("marks only claimed deliveries as needing reconciliation after an ambiguous provider failure", async () => {
    sendEmailBatchMock.mockRejectedValueOnce(new Error("Provider connection closed"));
    emailDeliveryGroupByMock.mockResolvedValue([{ status: "sending", _count: { _all: 1 } }]);

    await expect(
      triggerContentfulPublishCampaign({
        contentType: "newsletterTemplate",
        contentfulEntryId: "entry_123",
        contentfulVersion: "10",
      })
    ).rejects.toThrow("Provider connection closed");

    expect(emailCampaignUpdateMock).toHaveBeenLastCalledWith({
      where: { id: "campaign_123" },
      data: expect.objectContaining({
        status: "reconciliation_required",
        errorSummary: "Provider connection closed",
      }),
    });
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

  it("recovers an interrupted preparation using only its frozen audience", async () => {
    emailCampaignFindUniqueMock.mockResolvedValueOnce({
      id: "campaign_123", contentfulEntryId: "entry_123", contentfulContentType: "newsletterTemplate",
      audiencePreparedAt: null, contentSnapshotJson: { sys: { id: "entry_123" }, fields: { subject: "Frozen subject", body: "Frozen body" } },
      audienceSnapshotJson: [{ subscriberId: "original", userId: null, email: "original@example.com", firstName: "Original" }],
    });
    newsletterSubscriberFindManyMock.mockResolvedValue([{ email: "new@example.com" }]);
    await retryContentfulCampaign({ campaignId: "campaign_123" });
    expect(emailDeliveryCreateMock).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ toEmail: "original@example.com", subject: "Frozen subject" }) }));
    expect(emailDeliveryCreateMock).toHaveBeenCalledTimes(1);
    expect(getEntriesMock).not.toHaveBeenCalled();
    expect(sendEmailBatchMock).not.toHaveBeenCalled();
  });

  it("does not invent a recipient list for an older interrupted preparation", async () => {
    emailCampaignFindUniqueMock.mockResolvedValueOnce({
      id: "campaign_123", contentfulEntryId: "entry_123", contentfulContentType: "newsletterTemplate",
      audiencePreparedAt: null, contentSnapshotJson: { fields: { subject: "Frozen" } }, audienceSnapshotJson: null,
    });
    await expect(retryContentfulCampaign({ campaignId: "campaign_123" })).rejects.toThrow("CAMPAIGN_AUDIENCE_REQUIRES_REVIEW");
    expect(newsletterSubscriberFindManyMock).not.toHaveBeenCalled();
  });

  it("blocks reconciliation while another worker owns the campaign", async () => {
    emailCampaignUpdateManyMock.mockResolvedValueOnce({ count: 0 });
    await expect(reconcileContentfulCampaign({ campaignId: "campaign_123", actorUserId: "admin_1", resolution: "confirm_not_sent", deliveries: [{ id: "delivery_1", attemptCount: 1 }], note: "Checked provider" })).rejects.toThrow("CAMPAIGN_BUSY");
    expect(emailDeliveryUpdateManyMock).not.toHaveBeenCalled();
    expect(sendEmailBatchMock).not.toHaveBeenCalled();
  });

  it("releases the lease and exposes ambiguity after a failed retry", async () => {
    emailCampaignFindUniqueMock.mockResolvedValueOnce({
      id: "campaign_123", contentfulEntryId: "entry_123", contentfulContentType: "newsletterTemplate",
      audiencePreparedAt: new Date(), contentSnapshotJson: { fields: { subject: "Frozen" } },
    });
    emailDeliveryFindManyMock.mockResolvedValueOnce([{ id: "delivery_1", toEmail: "reader@example.com", subject: "Frozen", tag: "tag", messageStream: "broadcast", payloadJson: { htmlBody: "<p>Frozen</p>", textBody: "Frozen" }, metadataJson: {}, attemptCount: 1 }]);
    sendEmailBatchMock.mockRejectedValueOnce(new Error("Request timed out"));
    emailDeliveryGroupByMock.mockResolvedValue([{ status: "sending", _count: { _all: 1 } }]);
    await expect(retryContentfulCampaign({ campaignId: "campaign_123" })).rejects.toThrow("Request timed out");
    expect(emailCampaignUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "reconciliation_required" }) }));
    expect(emailCampaignUpdateManyMock).toHaveBeenLastCalledWith(expect.objectContaining({ data: { processingToken: null, processingLeaseExpiresAt: null } }));
  });

  it("processes due scheduled Contentful campaigns", async () => {
    emailCampaignFindManyMock.mockResolvedValue([
      {
        id: "campaign_123",
        contentfulEntryId: "entry_123",
        contentfulContentType: "newsletterTemplate",
        audienceType: "newsletter",
        audiencePreparedAt: new Date("2026-05-15T09:00:00.000Z"),
      },
    ]);
    emailDeliveryFindManyMock.mockResolvedValueOnce([
      {
        id: "delivery_1",
        toEmail: "reader@example.com",
        subject: "April newsletter",
        tag: "newsletter-campaign-campaign_123",
        messageStream: "broadcast",
        payloadJson: { htmlBody: "<html>Email</html>", textBody: "Newsletter" },
        metadataJson: { campaignId: "campaign_123" },
        attemptCount: 0,
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
