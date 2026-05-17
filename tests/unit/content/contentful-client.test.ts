import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("contentful client", () => {
  const originalEnv = {
    CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,
    CONTENTFUL_DELIVERY_TOKEN: process.env.CONTENTFUL_DELIVERY_TOKEN,
    CONTENTFUL_ENVIRONMENT: process.env.CONTENTFUL_ENVIRONMENT,
    CONTENTFUL_PREVIEW_TOKEN: process.env.CONTENTFUL_PREVIEW_TOKEN,
    CONTENTFUL_REQUEST_TIMEOUT_MS: process.env.CONTENTFUL_REQUEST_TIMEOUT_MS,
  };

  beforeEach(() => {
    vi.resetModules();
    process.env.CONTENTFUL_SPACE_ID = "space_123";
    process.env.CONTENTFUL_DELIVERY_TOKEN = "token_123";
    process.env.CONTENTFUL_ENVIRONMENT = "master";
    process.env.CONTENTFUL_PREVIEW_TOKEN = "preview_123";
    process.env.CONTENTFUL_REQUEST_TIMEOUT_MS = "1000";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.CONTENTFUL_SPACE_ID = originalEnv.CONTENTFUL_SPACE_ID;
    process.env.CONTENTFUL_DELIVERY_TOKEN = originalEnv.CONTENTFUL_DELIVERY_TOKEN;
    process.env.CONTENTFUL_ENVIRONMENT = originalEnv.CONTENTFUL_ENVIRONMENT;
    process.env.CONTENTFUL_PREVIEW_TOKEN = originalEnv.CONTENTFUL_PREVIEW_TOKEN;
    process.env.CONTENTFUL_REQUEST_TIMEOUT_MS = originalEnv.CONTENTFUL_REQUEST_TIMEOUT_MS;
  });

  it("throws when the upstream request aborts", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new DOMException("The operation was aborted.", "AbortError"));
    vi.stubGlobal("fetch", fetchMock);

    const { getEntries } = await import("@/lib/content/contentful-client");

    await expect(getEntries("classDefinition")).rejects.toThrow("CONTENTFUL_REQUEST_FAILED");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses the preview API and disables cache for draft reads", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ items: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getEntries } = await import("@/lib/content/contentful-client");

    await expect(getEntries("blogPost", { limit: 1 }, { preview: true })).resolves.toEqual({
      items: [],
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("https://preview.contentful.com/spaces/space_123/environments/master");
    expect(init.cache).toBe("no-store");
    expect(init.next).toBeUndefined();
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer preview_123");
  });

  it("throws for preview reads when no preview token is configured", async () => {
    process.env.CONTENTFUL_PREVIEW_TOKEN = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { getEntries } = await import("@/lib/content/contentful-client");

    await expect(getEntries("blogPost", { limit: 1 }, { preview: true })).rejects.toThrow(
      "CONTENTFUL_PREVIEW_TOKEN_MISSING"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
