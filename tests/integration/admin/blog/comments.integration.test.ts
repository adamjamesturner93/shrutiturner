import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupBlogRows, createBlogPostSlug, createBlogUser } from "../../helpers/blog-fixtures";

const TEST_SCOPE = "integration-blog-admin";

vi.mock("@/lib/postmark/client", () => ({
  getNotificationInbox: vi.fn(() => "admin@example.com"),
  sendPostmarkReactEmail: vi.fn(),
}));

const {
  createBlogComment,
  getBlogEngagement,
  listAdminBlogComments,
  updateAdminBlogCommentStatus,
} = await import("@/lib/blog/engagement-service");

describe("blog admin moderation integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupBlogRows(TEST_SCOPE);
  });

  afterAll(async () => {
    await cleanupBlogRows(TEST_SCOPE);
  });

  it("moderates comment threads for admin review and public visibility", async () => {
    const postSlug = createBlogPostSlug(TEST_SCOPE, "moderation");
    const author = await createBlogUser(TEST_SCOPE, "moderate");
    const topLevel = await createBlogComment({
      postSlug,
      userId: author.id,
      content: "Moderation target top level comment.",
    });
    await createBlogComment({
      postSlug,
      userId: author.id,
      content: "Reply that should follow the parent status.",
      parentId: topLevel.id,
    });

    let adminRows = await listAdminBlogComments({ status: "all" });
    expect(adminRows.some((row) => row.id === topLevel.id && row.replyCount === 1)).toBe(true);

    await updateAdminBlogCommentStatus({ id: topLevel.id, action: "hide" });
    let engagement = await getBlogEngagement({
      postSlug,
    });
    expect(engagement.comments).toHaveLength(0);

    adminRows = await listAdminBlogComments({ status: "hidden" });
    expect(adminRows.some((row) => row.id === topLevel.id)).toBe(true);

    await updateAdminBlogCommentStatus({ id: topLevel.id, action: "show" });
    engagement = await getBlogEngagement({
      postSlug,
    });
    expect(engagement.comments).toHaveLength(1);
    expect(engagement.comments[0]?.replies).toHaveLength(1);

    await updateAdminBlogCommentStatus({ id: topLevel.id, action: "delete" });
    adminRows = await listAdminBlogComments({ status: "all" });
    expect(adminRows.some((row) => row.id === topLevel.id)).toBe(false);
  });
});
