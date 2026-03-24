import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("contentful client", () => {
  const originalEnv = {
    CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,
    CONTENTFUL_DELIVERY_TOKEN: process.env.CONTENTFUL_DELIVERY_TOKEN,
    CONTENTFUL_ENVIRONMENT: process.env.CONTENTFUL_ENVIRONMENT,
    CONTENTFUL_REQUEST_TIMEOUT_MS: process.env.CONTENTFUL_REQUEST_TIMEOUT_MS,
  };

  beforeEach(() => {
    vi.resetModules();
    process.env.CONTENTFUL_SPACE_ID = "space_123";
    process.env.CONTENTFUL_DELIVERY_TOKEN = "token_123";
    process.env.CONTENTFUL_ENVIRONMENT = "master";
    process.env.CONTENTFUL_REQUEST_TIMEOUT_MS = "5";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.CONTENTFUL_SPACE_ID = originalEnv.CONTENTFUL_SPACE_ID;
    process.env.CONTENTFUL_DELIVERY_TOKEN = originalEnv.CONTENTFUL_DELIVERY_TOKEN;
    process.env.CONTENTFUL_ENVIRONMENT = originalEnv.CONTENTFUL_ENVIRONMENT;
    process.env.CONTENTFUL_REQUEST_TIMEOUT_MS = originalEnv.CONTENTFUL_REQUEST_TIMEOUT_MS;
  });

  it("returns null when the upstream request aborts", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new DOMException("The operation was aborted.", "AbortError"));
    vi.stubGlobal("fetch", fetchMock);

    const { getEntries } = await import("@/lib/content/contentful-client");

    await expect(getEntries("classDefinition")).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
