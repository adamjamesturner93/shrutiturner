import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const authMock = vi.fn();
const getCookieMock = vi.fn();
const cookiesMock = vi.fn();
const getBlogEngagementMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    connection: connectionMock,
  };
});

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/blog/engagement-service", () => ({
  getBlogEngagement: getBlogEngagementMock,
}));

const route = await import("@/app/api/blog/[slug]/engagement/route");

describe("GET /api/blog/[slug]/engagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    authMock.mockResolvedValue({ user: { id: "user_123" } });
    getCookieMock.mockReturnValue({ value: "anon-token" });
    cookiesMock.mockResolvedValue({ get: getCookieMock });
    getBlogEngagementMock.mockResolvedValue({
      postSlug: "test-post",
      reactionCount: 1,
      commentCount: 0,
      hasReacted: true,
      comments: [],
    });
  });

  it("passes the current user and anonymous cookie token through to the service", async () => {
    const response = await route.GET(
      new Request("http://localhost/api/blog/test-post/engagement"),
      {
        params: Promise.resolve({ slug: "test-post" }),
      }
    );

    expect(response.status).toBe(200);
    expect(getBlogEngagementMock).toHaveBeenCalledWith({
      postSlug: "test-post",
      currentUserId: "user_123",
      anonymousToken: "anon-token",
    });
  });

  it("returns a 500 response when the service fails", async () => {
    getBlogEngagementMock.mockRejectedValue(new Error("boom"));

    const response = await route.GET(
      new Request("http://localhost/api/blog/test-post/engagement"),
      {
        params: Promise.resolve({ slug: "test-post" }),
      }
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Failed to load blog engagement.",
    });
  });
});
