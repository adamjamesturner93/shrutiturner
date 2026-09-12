import { beforeEach, describe, expect, it, vi } from "vitest";
const { auth, list } = vi.hoisted(() => ({ auth: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/content/admin-media", () => ({ listAdminImages: list }));
import { GET } from "@/app/api/admin/media/images/route";

describe("admin media API", () => {
  beforeEach(() => { auth.mockResolvedValue({ user: { id: "admin", role: "admin" } }); list.mockResolvedValue({ items: [] }); });
  it("denies members before querying Contentful", async () => {
    auth.mockResolvedValue({ user: { id: "member", role: "member" } });
    expect((await GET(new Request("http://localhost/api/admin/media/images"), {})).status).toBe(403);
    expect(list).not.toHaveBeenCalled();
  });
  it("validates pagination", async () => {
    expect((await GET(new Request("http://localhost/api/admin/media/images?page=-1"), {})).status).toBe(400);
  });
  it("returns private uncached results", async () => {
    const response = await GET(new Request("http://localhost/api/admin/media/images?q=trees&page=2"), {});
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(list).toHaveBeenCalledWith("trees", 2);
  });
});
