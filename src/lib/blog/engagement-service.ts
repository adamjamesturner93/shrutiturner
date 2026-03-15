import { BlogCommentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getNotificationInbox, sendPostmarkReactEmail } from "@/lib/postmark/client";
import { buildAbsoluteUrl } from "@/lib/app-url";
import BlogCommentNotificationEmail from "@/emails/blog-comment-notification";

const COMMENT_MIN_LENGTH = 3;
const COMMENT_MAX_LENGTH = 3000;

function toAuthorName(user: {
  firstName: string | null;
  lastName: string | null;
  name: string | null;
}) {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return fullName || user.name || "Member";
}

function toInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function sendNewCommentNotification(input: {
  postSlug: string;
  authorName: string;
  content: string;
}) {
  const postUrl = buildAbsoluteUrl(`/blog/${input.postSlug}`);
  await sendPostmarkReactEmail({
    to: getNotificationInbox("BLOG_COMMENT_NOTIFICATION_EMAIL"),
    subject: `New blog comment on ${input.postSlug}`,
    react: BlogCommentNotificationEmail({
      authorName: input.authorName,
      postSlug: input.postSlug,
      content: input.content,
      postUrl,
    }),
    textBody: `New blog comment from ${input.authorName}\n\nPost: ${input.postSlug}\n\n${input.content}\n\nReview: ${postUrl}`,
    tag: "blog-comment-notification",
    metadata: {
      postSlug: input.postSlug,
    },
  });
}

const replyCommentSelect = Prisma.validator<Prisma.BlogCommentSelect>()({
  id: true,
  postSlug: true,
  parentId: true,
  content: true,
  createdAt: true,
  status: true,
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
    },
  },
});

const commentSelect = Prisma.validator<Prisma.BlogCommentSelect>()({
  id: true,
  postSlug: true,
  parentId: true,
  content: true,
  createdAt: true,
  status: true,
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
    },
  },
  replies: {
    where: { status: BlogCommentStatus.visible },
    orderBy: { createdAt: "asc" },
    select: replyCommentSelect,
  },
});

function mapCommentRow(
  row: Prisma.BlogCommentGetPayload<{
    select: typeof commentSelect;
  }>
) {
  const authorName = toAuthorName(row.author);
  return {
    id: row.id,
    postSlug: row.postSlug,
    parentId: row.parentId,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    status: row.status,
    authorId: row.author.id,
    authorName,
    authorInitials: toInitials(authorName),
    replies: row.replies.map((reply) => {
      const replyAuthorName = toAuthorName(reply.author);
      return {
        id: reply.id,
        postSlug: reply.postSlug,
        parentId: reply.parentId,
        content: reply.content,
        createdAt: reply.createdAt.toISOString(),
        status: reply.status,
        authorId: reply.author.id,
        authorName: replyAuthorName,
        authorInitials: toInitials(replyAuthorName),
      };
    }),
  };
}

export async function getBlogEngagement(input: {
  postSlug: string;
  currentUserId?: string | null;
  anonymousToken?: string | null;
}) {
  const [comments, reactionCount, userReaction] = await Promise.all([
    db.blogComment.findMany({
      where: {
        postSlug: input.postSlug,
        parentId: null,
        status: BlogCommentStatus.visible,
      },
      orderBy: { createdAt: "asc" },
      select: commentSelect,
    }),
    db.blogReaction.count({ where: { postSlug: input.postSlug } }),
    input.currentUserId
      ? db.blogReaction.findUnique({
          where: {
            postSlug_userId: {
              postSlug: input.postSlug,
              userId: input.currentUserId,
            },
          },
          select: { id: true },
        })
      : input.anonymousToken
        ? db.blogReaction.findUnique({
            where: {
              postSlug_anonymousToken: {
                postSlug: input.postSlug,
                anonymousToken: input.anonymousToken,
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
  ]);

  const commentCount = await db.blogComment.count({
    where: { postSlug: input.postSlug, status: BlogCommentStatus.visible },
  });

  return {
    postSlug: input.postSlug,
    reactionCount,
    commentCount,
    hasReacted: Boolean(userReaction),
    comments: comments.map(mapCommentRow),
  };
}

export async function createBlogComment(input: {
  postSlug: string;
  userId: string;
  content: string;
  parentId?: string | null;
}) {
  const content = input.content.trim();
  if (content.length < COMMENT_MIN_LENGTH) {
    throw new Error("COMMENT_TOO_SHORT");
  }
  if (content.length > COMMENT_MAX_LENGTH) {
    throw new Error("COMMENT_TOO_LONG");
  }

  if (input.parentId) {
    const parent = await db.blogComment.findUnique({
      where: { id: input.parentId },
      select: { id: true, postSlug: true, parentId: true, status: true },
    });
    if (
      !parent ||
      parent.postSlug !== input.postSlug ||
      parent.status !== BlogCommentStatus.visible
    ) {
      throw new Error("PARENT_NOT_FOUND");
    }
    if (parent.parentId) {
      throw new Error("NESTING_NOT_ALLOWED");
    }
  }

  const created = await db.blogComment.create({
    data: {
      postSlug: input.postSlug,
      authorUserId: input.userId,
      parentId: input.parentId || null,
      content,
      status: BlogCommentStatus.visible,
    },
    select: {
      id: true,
      postSlug: true,
      parentId: true,
      content: true,
      createdAt: true,
      status: true,
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
    },
  });

  const authorName = toAuthorName(created.author);
  await sendNewCommentNotification({
    postSlug: input.postSlug,
    authorName,
    content,
  }).catch((error) => {
    console.error("Failed to send blog comment notification", error);
  });

  return {
    id: created.id,
    postSlug: created.postSlug,
    parentId: created.parentId,
    content: created.content,
    createdAt: created.createdAt.toISOString(),
    status: created.status,
    authorId: created.author.id,
    authorName,
    authorInitials: toInitials(authorName),
  };
}

export async function toggleBlogReaction(input: {
  postSlug: string;
  userId?: string | null;
  anonymousToken?: string | null;
}) {
  if (!input.userId && !input.anonymousToken) {
    throw new Error("REACTION_IDENTITY_REQUIRED");
  }

  const existing = input.userId
    ? await db.blogReaction.findUnique({
        where: {
          postSlug_userId: {
            postSlug: input.postSlug,
            userId: input.userId,
          },
        },
        select: { id: true },
      })
    : await db.blogReaction.findUnique({
        where: {
          postSlug_anonymousToken: {
            postSlug: input.postSlug,
            anonymousToken: input.anonymousToken!,
          },
        },
        select: { id: true },
      });

  if (existing) {
    await db.blogReaction.delete({ where: { id: existing.id } });
  } else {
    await db.blogReaction.create({
      data: {
        postSlug: input.postSlug,
        userId: input.userId || null,
        anonymousToken: input.userId ? null : input.anonymousToken!,
      },
    });
  }

  const reactionCount = await db.blogReaction.count({ where: { postSlug: input.postSlug } });
  return {
    hasReacted: !existing,
    reactionCount,
  };
}

export async function listAdminBlogComments(params: {
  postSlug?: string;
  search?: string;
  status?: "visible" | "hidden" | "deleted" | "all";
}) {
  const where: Prisma.BlogCommentWhereInput = {
    postSlug: params.postSlug || undefined,
    status: params.status && params.status !== "all" ? params.status : undefined,
    OR: params.search
      ? [
          { content: { contains: params.search, mode: "insensitive" } },
          { author: { email: { contains: params.search, mode: "insensitive" } } },
          { author: { firstName: { contains: params.search, mode: "insensitive" } } },
          { author: { lastName: { contains: params.search, mode: "insensitive" } } },
        ]
      : undefined,
  };

  const rows = await db.blogComment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      postSlug: true,
      parentId: true,
      content: true,
      status: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    postSlug: row.postSlug,
    parentId: row.parentId,
    content: row.content,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    authorId: row.author.id,
    authorEmail: row.author.email,
    authorName: toAuthorName(row.author),
    replyCount: row._count.replies,
  }));
}

export async function updateAdminBlogCommentStatus(input: {
  id: string;
  action: "hide" | "show" | "delete";
}) {
  const comment = await db.blogComment.findUnique({
    where: { id: input.id },
    select: { id: true, parentId: true },
  });
  if (!comment) {
    throw new Error("NOT_FOUND");
  }

  if (input.action === "delete") {
    await db.blogComment.deleteMany({
      where: {
        OR: [{ id: input.id }, { parentId: input.id }],
      },
    });
    return { ok: true };
  }

  const nextStatus = input.action === "hide" ? "hidden" : "visible";
  await db.blogComment.updateMany({
    where: {
      OR: [{ id: input.id }, { parentId: input.id }],
    },
    data: { status: nextStatus },
  });

  return { ok: true };
}
