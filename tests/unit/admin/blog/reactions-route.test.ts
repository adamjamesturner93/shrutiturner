import { beforeEach, expect, it, vi } from "vitest";
const { auth, list } = vi.hoisted(() => ({ auth: vi.fn(), list: vi.fn() }));
vi.mock("next/server", async () => ({
  ...(await vi.importActual<typeof import("next/server")>("next/server")),
  connection: vi.fn(),
}));
vi.mock("@/lib/api/auth-user", () => ({ requireStaffAdminUser: auth }));
vi.mock("@/lib/blog/engagement-service", () => ({ listAdminBlogReactions: list }));
vi.mock("@/lib/content/public-content", () => ({ getBlogPosts: vi.fn().mockResolvedValue([]) }));
import { getBlogPosts } from "@/lib/content/public-content";
const { GET } = await import("@/app/api/admin/blog/reactions/route");
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getBlogPosts).mockResolvedValue([]);
  auth.mockResolvedValue({ id: "staff" });
});
it.each([
  ["UNAUTHORIZED", 401],
  ["FORBIDDEN", 403],
])("denies %s before reading reactions", async (message, status) => {
  auth.mockRejectedValue(new Error(String(message)));
  expect((await GET()).status).toBe(status);
  expect(list).not.toHaveBeenCalled();
});
it("returns aggregate reactions with private no-store caching", async () => {
  list.mockResolvedValue([{ postSlug: "post-without-comments", count: 2 }]);
  const response = await GET();
  expect(await response.json()).toEqual([
    { postSlug: "post-without-comments", title: "post without comments", count: 2 },
  ]);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

it("uses the published title for a reacted post", async () => {
  vi.mocked(getBlogPosts).mockResolvedValue([
    {
      id: "a-post",
      title: "A Real Title",
      excerpt: "",
      content: "",
      authors: [],
      date: "",
      tags: [],
      readTime: "",
      coverImage: "",
      coverAlt: "",
    },
  ]);
  list.mockResolvedValue([{ postSlug: "a-post", count: 1 }]);
  expect(await (await GET()).json()).toEqual([
    { postSlug: "a-post", title: "A Real Title", count: 1 },
  ]);
});
