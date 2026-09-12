import { beforeEach, describe, expect, it, vi } from "vitest";

const { assets, config } = vi.hoisted(() => ({ assets: vi.fn(), config: vi.fn() }));
vi.mock("@/lib/content/contentful-client", () => ({ getAssets: assets }));
vi.mock("@/lib/content/config", () => ({ getContentfulConfig: config }));
import { listAdminImages } from "@/lib/content/admin-media";

describe("admin image library", () => {
  beforeEach(() => {
    config.mockReturnValue({ spaceId: "space", environment: "sandbox", deliveryToken: "secret" });
  });
  it("returns only safe image assets with descriptions and paginated search", async () => {
    assets.mockResolvedValue({ skip: 24, limit: 24, total: 50, items: [
      { sys: { id: "photo" }, fields: { title: "Outdoors", description: "A walk", file: { url: "//images.ctfassets.net/photo.jpg", contentType: "image/jpeg" } } },
      { sys: { id: "document" }, fields: { file: { url: "https://assets.ctfassets.net/file.pdf", contentType: "application/pdf" } } },
      { sys: { id: "unprocessed" }, fields: {} },
      { sys: { id: "unsafe" }, fields: { file: { url: "javascript:alert(1)", contentType: "image/jpeg" } } },
    ] });
    const result = await listAdminImages("outdoors", 2);
    expect(assets).toHaveBeenCalledWith(expect.objectContaining({ query: "outdoors", skip: 24, limit: 24, mimetype_group: "image" }));
    expect(result.items).toEqual([{ assetId: "photo", title: "Outdoors", alt: "A walk", url: "https://images.ctfassets.net/photo.jpg" }]);
    expect(result.hasMore).toBe(true);
    expect(result.libraryUrl).toBe("https://app.contentful.com/spaces/space/environments/sandbox/assets");
    expect(JSON.stringify(result)).not.toContain("secret");
  });
  it("requires configuration rather than silently returning an empty library", async () => {
    config.mockReturnValue(null);
    await expect(listAdminImages("", 1)).rejects.toThrow("MEDIA_NOT_CONFIGURED");
  });
});
