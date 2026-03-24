import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTagMock = vi.fn();
const triggerContentfulPublishCampaignMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/lib/newsletter/campaign-automation", () => ({
  triggerContentfulPublishCampaign: triggerContentfulPublishCampaignMock,
}));

async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/webhooks/contentful/route");
}

describe("POST /api/webhooks/contentful", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CONTENTFUL_WEBHOOK_SECRET = "contentful-secret";
    triggerContentfulPublishCampaignMock.mockResolvedValue({
      skipped: false,
      campaignId: "campaign_123",
    });
  });

  it("rejects unauthorized webhook requests", async () => {
    const route = await loadRoute();

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/contentful", {
        method: "POST",
        headers: {
          "x-contentful-webhook-secret": "wrong",
        },
        body: "{}",
      }) as never
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("revalidates mapped tags and triggers publish automation for publish events", async () => {
    const route = await loadRoute();

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/contentful", {
        method: "POST",
        headers: {
          "x-contentful-webhook-secret": "contentful-secret",
          "x-contentful-topic": "ContentManagement.Entry.publish.classDefinition",
          "x-contentful-content-type": "classDefinition",
          "x-contentful-id": "entry_123",
        },
        body: JSON.stringify({
          sys: {
            id: "entry_123",
            version: 42,
            contentType: {
              sys: {
                id: "classDefinition",
              },
            },
          },
        }),
      }) as never
    );

    expect(response.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledWith("content:classes", "max");
    expect(revalidateTagMock).toHaveBeenCalledWith("content:schedule", "max");
    expect(triggerContentfulPublishCampaignMock).toHaveBeenCalledWith({
      contentType: "classDefinition",
      contentfulEntryId: "entry_123",
      contentfulVersion: "42",
    });
  });

  it("does not trigger campaign automation for non-publish events", async () => {
    const route = await loadRoute();

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/contentful", {
        method: "POST",
        headers: {
          "x-contentful-webhook-secret": "contentful-secret",
          "x-contentful-topic": "ContentManagement.Entry.save.blogPost",
        },
        body: "{}",
      }) as never
    );

    expect(response.status).toBe(200);
    expect(triggerContentfulPublishCampaignMock).not.toHaveBeenCalled();
  });
});
