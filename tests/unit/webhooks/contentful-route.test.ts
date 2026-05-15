import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTagMock = vi.fn();
const revalidatePathMock = vi.fn();
const getBlogPostSlugByContentfulEntryIdMock = vi.fn();
const triggerContentfulPublishCampaignMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/lib/content", () => ({
  getBlogPostSlugByContentfulEntryId: getBlogPostSlugByContentfulEntryIdMock,
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
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL;
    getBlogPostSlugByContentfulEntryIdMock.mockResolvedValue("resolved-blog-post");
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

  it("fails closed in deployed environments when the webhook secret is not configured", async () => {
    delete process.env.CONTENTFUL_WEBHOOK_SECRET;
    process.env.VERCEL_ENV = "production";
    const route = await loadRoute();

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/contentful", {
        method: "POST",
        headers: {
          "x-contentful-topic": "ContentManagement.Entry.publish.blogPost",
        },
        body: "{}",
      }) as never
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "webhook_secret_not_configured" });
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
    expect(revalidatePathMock).toHaveBeenCalledWith("/sitemap.xml");
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

  it("revalidates blog listing and post paths from the webhook payload slug", async () => {
    const route = await loadRoute();

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/contentful", {
        method: "POST",
        headers: {
          "x-contentful-webhook-secret": "contentful-secret",
          "x-contentful-topic": "ContentManagement.Entry.publish.blogPost",
          "x-contentful-content-type": "blogPost",
          "x-contentful-id": "entry_blog",
        },
        body: JSON.stringify({
          fields: {
            slug: {
              "en-US": "strength-after-stretching",
            },
          },
          sys: {
            id: "entry_blog",
            version: 7,
            contentType: {
              sys: {
                id: "blogPost",
              },
            },
          },
        }),
      }) as never
    );

    expect(response.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledWith("content:blog", "max");
    expect(revalidatePathMock).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePathMock).toHaveBeenCalledWith("/blog");
    expect(revalidatePathMock).toHaveBeenCalledWith("/blog/strength-after-stretching");
    expect(getBlogPostSlugByContentfulEntryIdMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      paths: ["/blog", "/blog/strength-after-stretching"],
    });
  });

  it("falls back to resolving the blog slug by Contentful entry id", async () => {
    const route = await loadRoute();

    const response = await route.POST(
      new Request("http://localhost/api/webhooks/contentful", {
        method: "POST",
        headers: {
          "x-contentful-webhook-secret": "contentful-secret",
          "x-contentful-topic": "ContentManagement.Entry.unpublish.blogPost",
          "x-contentful-content-type": "blogPost",
          "x-contentful-id": "entry_blog",
        },
        body: JSON.stringify({
          sys: {
            id: "entry_blog",
            contentType: {
              sys: {
                id: "blogPost",
              },
            },
          },
        }),
      }) as never
    );

    expect(response.status).toBe(200);
    expect(getBlogPostSlugByContentfulEntryIdMock).toHaveBeenCalledWith("entry_blog");
    expect(revalidatePathMock).toHaveBeenCalledWith("/blog");
    expect(revalidatePathMock).toHaveBeenCalledWith("/blog/resolved-blog-post");
  });
});
