import { beforeEach, describe, expect, it, vi } from "vitest";

const isKnownBlogPostSlugMock = vi.fn();
const requireSessionUserMock = vi.fn();
const createBlogCommentMock = vi.fn();
const isRateLimitedMock = vi.fn();

vi.mock("@/lib/blog/post-validation", () => ({
  isKnownBlogPostSlug: isKnownBlogPostSlugMock,
}));

vi.mock("@/lib/api/auth-user", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/lib/blog/engagement-service", () => ({
  createBlogComment: createBlogCommentMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: isRateLimitedMock,
}));

const route = await import("@/app/api/blog/[slug]/comments/route");

function createRequest(body?: Record<string, unknown>) {
  return new Request("http://localhost/api/blog/test-post/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "",
  });
}

describe("POST /api/blog/[slug]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isKnownBlogPostSlugMock.mockResolvedValue(true);
    requireSessionUserMock.mockResolvedValue({ id: "user_123" });
    isRateLimitedMock.mockReturnValue(false);
    createBlogCommentMock.mockResolvedValue({
      id: "comment_123",
      postSlug: "test-post",
      parentId: null,
      content: "Helpful comment",
    });
  });

  it("returns 401 when the user is not authenticated", async () => {
    requireSessionUserMock.mockRejectedValue(new Error("UNAUTHORIZED"));

    const response = await route.POST(createRequest({ content: "Hello there" }), {
      params: Promise.resolve({ slug: "test-post" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });

  it("returns 404 for an unknown blog post slug", async () => {
    isKnownBlogPostSlugMock.mockResolvedValue(false);

    const response = await route.POST(createRequest({ content: "Hello there" }), {
      params: Promise.resolve({ slug: "missing-post" }),
    });

    expect(response.status).toBe(404);
    expect(requireSessionUserMock).not.toHaveBeenCalled();
    expect(isRateLimitedMock).not.toHaveBeenCalled();
    expect(createBlogCommentMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      message: "Blog post not found.",
    });
  });

  it("rate limits repeated comment creation", async () => {
    isRateLimitedMock.mockReturnValue(true);

    const response = await route.POST(createRequest({ content: "Hello there" }), {
      params: Promise.resolve({ slug: "test-post" }),
    });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      message: "Too many comments. Please slow down.",
    });
  });

  it("creates a comment with the authenticated user and route slug", async () => {
    const response = await route.POST(
      createRequest({ content: "Helpful comment", parentId: "parent_123" }),
      {
        params: Promise.resolve({ slug: "test-post" }),
      }
    );

    expect(response.status).toBe(201);
    expect(createBlogCommentMock).toHaveBeenCalledWith({
      postSlug: "test-post",
      userId: "user_123",
      content: "Helpful comment",
      parentId: "parent_123",
    });
  });

  it("maps validation errors to a 400 response", async () => {
    createBlogCommentMock.mockRejectedValue(new Error("NESTING_NOT_ALLOWED"));

    const response = await route.POST(createRequest({ content: "Reply", parentId: "reply_123" }), {
      params: Promise.resolve({ slug: "test-post" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Please check your comment and try again.",
    });
  });
});
