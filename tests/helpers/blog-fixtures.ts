import type { UserRole } from "@prisma/client";
import { db } from "./db";
import { sanitizeSegment, uniqueToken } from "./_shared";

const BLOG_SCOPE_PREFIX = "test-blog";
const BLOG_EMAIL_PREFIX = "blog-fixture+";

export function createBlogPostSlug(scope: string, slug: string) {
  const normalizedScope = sanitizeSegment(scope) || "scope";
  const normalizedSlug = sanitizeSegment(slug) || "post";
  return `${BLOG_SCOPE_PREFIX}-${normalizedScope}-${normalizedSlug}`;
}

export async function createBlogUser(scope: string, label: string, role: UserRole = "member") {
  const normalizedScope = sanitizeSegment(scope) || "scope";
  const normalizedLabel = sanitizeSegment(label) || "reader";
  const email = `${BLOG_EMAIL_PREFIX}${normalizedScope}-${uniqueToken(normalizedLabel)}@example.com`;

  return db.user.create({
    data: {
      email,
      firstName: "Blog",
      lastName: normalizedLabel,
      name: `Blog ${normalizedLabel}`,
      role,
      emailVerified: new Date(),
    },
  });
}

export async function cleanupBlogRows(scope: string) {
  const normalizedScope = sanitizeSegment(scope) || "scope";
  const slugPrefix = `${BLOG_SCOPE_PREFIX}-${normalizedScope}-`;
  const emailPrefix = `${BLOG_EMAIL_PREFIX}${normalizedScope}-`;

  const users = await db.user.findMany({
    where: {
      email: {
        startsWith: emailPrefix,
      },
    },
    select: {
      id: true,
    },
  });

  const userIds = users.map((user) => user.id);
  const scopedPostFilter = { postSlug: { startsWith: slugPrefix } } as const;
  const scopedUserFilter = userIds.length ? ({ userId: { in: userIds } } as const) : null;
  const scopedAuthorFilter = userIds.length ? ({ authorUserId: { in: userIds } } as const) : null;

  await db.blogReaction.deleteMany({
    where: {
      OR: [scopedPostFilter, ...(scopedUserFilter ? [scopedUserFilter] : [])],
    },
  });
  await db.blogComment.deleteMany({
    where: {
      OR: [scopedPostFilter, ...(scopedAuthorFilter ? [scopedAuthorFilter] : [])],
    },
  });

  if (userIds.length) {
    await db.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });
  }
}
