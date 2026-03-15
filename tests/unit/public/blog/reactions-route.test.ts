import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getCookieMock = vi.fn();
const cookiesMock = vi.fn();
const toggleBlogReactionMock = vi.fn();
const randomUuidMock = vi.fn();

vi.mock("node:crypto", () => ({
  randomUUID: randomUuidMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/blog/engagement-service", () => ({
  toggleBlogReaction: toggleBlogReactionMock,
}));

const route = await import("@/app/api/blog/[slug]/reactions/toggle/route");

describe("POST /api/blog/[slug]/reactions/toggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(null);
    getCookieMock.mockReturnValue(undefined);
    cookiesMock.mockResolvedValue({ get: getCookieMock });
    randomUuidMock.mockReturnValue("generated-anon-token");
    toggleBlogReactionMock.mockResolvedValue({
      hasReacted: true,
      reactionCount: 2,
    });
  });

  it("creates an anonymous token cookie for signed-out readers", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/blog/test-post/reactions"),
      {
        params: Promise.resolve({ slug: "test-post" }),
      }
    );

    expect(toggleBlogReactionMock).toHaveBeenCalledWith({
      postSlug: "test-post",
      userId: null,
      anonymousToken: "generated-anon-token",
    });
    expect(response.headers.get("set-cookie")).toContain(
      "blog_reaction_token=generated-anon-token"
    );
  });

  it("reuses the existing anonymous token when present", async () => {
    getCookieMock.mockReturnValue({ value: "existing-anon-token" });

    const response = await route.POST(
      new Request("http://localhost/api/blog/test-post/reactions"),
      {
        params: Promise.resolve({ slug: "test-post" }),
      }
    );

    expect(toggleBlogReactionMock).toHaveBeenCalledWith({
      postSlug: "test-post",
      userId: null,
      anonymousToken: "existing-anon-token",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("uses the authenticated user id instead of an anonymous token", async () => {
    authMock.mockResolvedValue({ user: { id: "user_123" } });

    const response = await route.POST(
      new Request("http://localhost/api/blog/test-post/reactions"),
      {
        params: Promise.resolve({ slug: "test-post" }),
      }
    );

    expect(toggleBlogReactionMock).toHaveBeenCalledWith({
      postSlug: "test-post",
      userId: "user_123",
      anonymousToken: null,
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
