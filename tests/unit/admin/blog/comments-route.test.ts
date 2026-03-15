import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.fn();
const requireAdminUserMock = vi.fn();
const listAdminBlogCommentsMock = vi.fn();
const updateAdminBlogCommentStatusMock = vi.fn();

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    connection: connectionMock,
  };
});

vi.mock("@/lib/api/auth-user", () => ({
  requireAdminUser: requireAdminUserMock,
}));

vi.mock("@/lib/blog/engagement-service", () => ({
  listAdminBlogComments: listAdminBlogCommentsMock,
  updateAdminBlogCommentStatus: updateAdminBlogCommentStatusMock,
}));

const route = await import("@/app/api/admin/blog/comments/route");

function createPatchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/blog/comments", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/admin/blog/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionMock.mockResolvedValue(undefined);
    requireAdminUserMock.mockResolvedValue({ id: "admin_123", role: "admin" });
    listAdminBlogCommentsMock.mockResolvedValue([]);
    updateAdminBlogCommentStatusMock.mockResolvedValue({ ok: true });
  });

  it("requires an authenticated admin user", async () => {
    requireAdminUserMock.mockRejectedValue(new Error("UNAUTHORIZED"));

    const response = await route.GET(new Request("http://localhost/api/admin/blog/comments"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });

  it("passes search params through to the admin listing service", async () => {
    const response = await route.GET(
      new Request(
        "http://localhost/api/admin/blog/comments?postSlug=test-post&search=hello&status=hidden"
      )
    );

    expect(response.status).toBe(200);
    expect(listAdminBlogCommentsMock).toHaveBeenCalledWith({
      postSlug: "test-post",
      search: "hello",
      status: "hidden",
    });
  });
});

describe("PATCH /api/admin/blog/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminUserMock.mockResolvedValue({ id: "admin_123", role: "admin" });
    updateAdminBlogCommentStatusMock.mockResolvedValue({ ok: true });
  });

  it("validates the required comment id", async () => {
    const response = await route.PATCH(createPatchRequest({ action: "hide" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Comment id is required.",
    });
  });

  it("validates the moderation action", async () => {
    const response = await route.PATCH(
      createPatchRequest({ id: "comment_123", action: "archive" })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Invalid action.",
    });
  });

  it("maps not-found errors to 404", async () => {
    updateAdminBlogCommentStatusMock.mockRejectedValue(new Error("NOT_FOUND"));

    const response = await route.PATCH(createPatchRequest({ id: "comment_123", action: "delete" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "Comment not found.",
    });
  });
});
