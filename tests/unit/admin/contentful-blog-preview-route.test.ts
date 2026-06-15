import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminUserMock = vi.fn();
const getBlogPostPreviewBySlugMock = vi.fn();

vi.mock("@/lib/api/auth-user", () => ({
  requireStaffAdminUser: requireStaffAdminUserMock,
}));

vi.mock("@/lib/content", () => ({
  getBlogPostPreviewBySlug: getBlogPostPreviewBySlugMock,
}));

const route = await import("@/app/api/admin/contentful/blog-preview/[slug]/route");

describe("GET /api/admin/contentful/blog-preview/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffAdminUserMock.mockResolvedValue({ id: "admin_123" });
    getBlogPostPreviewBySlugMock.mockResolvedValue({
      id: "draft-post",
      title: "Draft Post",
    });
  });

  it("returns a draft blog preview for staff admins", async () => {
    const response = await route.GET(
      new Request("http://localhost/api/admin/contentful/blog-preview/draft-post"),
      {
        params: Promise.resolve({ slug: "draft-post" }),
      }
    );

    expect(response.status).toBe(200);
    expect(getBlogPostPreviewBySlugMock).toHaveBeenCalledWith("draft-post");
    await expect(response.json()).resolves.toMatchObject({ title: "Draft Post" });
  });

  it("requires staff admin access", async () => {
    requireStaffAdminUserMock.mockRejectedValue(new Error("FORBIDDEN"));

    const response = await route.GET(
      new Request("http://localhost/api/admin/contentful/blog-preview/draft-post"),
      {
        params: Promise.resolve({ slug: "draft-post" }),
      }
    );

    expect(response.status).toBe(403);
    expect(getBlogPostPreviewBySlugMock).not.toHaveBeenCalled();
  });
});
