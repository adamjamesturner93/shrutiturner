import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupBlogRows, createBlogPostSlug, createBlogUser } from "../../helpers/blog-fixtures";

const sendPostmarkReactEmailMock = vi.fn();
const TEST_SCOPE = "integration-blog-public";

vi.mock("@/lib/postmark/client", () => ({
  getNotificationInbox: vi.fn(() => "admin@example.com"),
  sendPostmarkReactEmail: sendPostmarkReactEmailMock,
}));

const { createBlogComment, getBlogEngagement, toggleBlogReaction } =
  await import("@/lib/blog/engagement-service");

describe("blog public engagement integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupBlogRows(TEST_SCOPE);
  });

  afterAll(async () => {
    await cleanupBlogRows(TEST_SCOPE);
  });

  it("creates top-level comments and replies, then returns visible engagement", async () => {
    const postSlug = createBlogPostSlug(TEST_SCOPE, "thread");
    const author = await createBlogUser(TEST_SCOPE, "author");
    const secondAuthor = await createBlogUser(TEST_SCOPE, "reply");

    const topLevel = await createBlogComment({
      postSlug,
      userId: author.id,
      content: "This is a genuinely helpful article.",
    });
    await createBlogComment({
      postSlug,
      userId: secondAuthor.id,
      content: "Thanks for writing this.",
      parentId: topLevel.id,
    });

    const engagement = await getBlogEngagement({
      postSlug,
      currentUserId: null,
      anonymousToken: null,
    });

    expect(engagement.commentCount).toBe(2);
    expect(engagement.comments).toHaveLength(1);
    expect(engagement.comments[0]?.replies).toHaveLength(1);
    expect(sendPostmarkReactEmailMock).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid reply targets and nested replies", async () => {
    const postSlug = createBlogPostSlug(TEST_SCOPE, "nested");
    const otherPostSlug = createBlogPostSlug(TEST_SCOPE, "other");
    const author = await createBlogUser(TEST_SCOPE, "nested");
    const topLevel = await createBlogComment({
      postSlug,
      userId: author.id,
      content: "Top level comment for nesting test.",
    });
    const reply = await createBlogComment({
      postSlug,
      userId: author.id,
      content: "First reply is valid.",
      parentId: topLevel.id,
    });

    await expect(
      createBlogComment({
        postSlug,
        userId: author.id,
        content: "x",
      })
    ).rejects.toThrow("COMMENT_TOO_SHORT");

    await expect(
      createBlogComment({
        postSlug: otherPostSlug,
        userId: author.id,
        content: "This should fail because the parent is on another post.",
        parentId: topLevel.id,
      })
    ).rejects.toThrow("PARENT_NOT_FOUND");

    await expect(
      createBlogComment({
        postSlug,
        userId: author.id,
        content: "This nested reply should not be allowed.",
        parentId: reply.id,
      })
    ).rejects.toThrow("NESTING_NOT_ALLOWED");
  });

  it("toggles reactions for authenticated and anonymous readers", async () => {
    const postSlug = createBlogPostSlug(TEST_SCOPE, "reactions");
    const user = await createBlogUser(TEST_SCOPE, "reactor");

    const first = await toggleBlogReaction({
      postSlug,
      userId: user.id,
    });
    const second = await toggleBlogReaction({
      postSlug,
      userId: user.id,
    });

    expect(first).toMatchObject({ hasReacted: true, reactionCount: 1 });
    expect(second).toMatchObject({ hasReacted: false, reactionCount: 0 });

    const anonToken = `${TEST_SCOPE}-anon-${Date.now()}`;
    const anon = await toggleBlogReaction({
      postSlug,
      anonymousToken: anonToken,
    });
    const engagement = await getBlogEngagement({
      postSlug,
      anonymousToken: anonToken,
    });

    expect(anon).toMatchObject({ hasReacted: true, reactionCount: 1 });
    expect(engagement.hasReacted).toBe(true);
    expect(engagement.reactionCount).toBe(1);
  });
});
