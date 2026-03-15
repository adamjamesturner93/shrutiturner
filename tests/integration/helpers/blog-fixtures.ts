import { db } from "@/lib/db";

export function makeBlogEmail(scope: string, label: string) {
  return `${scope}-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export function createBlogPostSlug(scope: string, label: string) {
  return `${scope}-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function cleanupBlogRows(scope: string) {
  await db.blogReaction.deleteMany({
    where: {
      OR: [
        { user: { email: { startsWith: `${scope}-` } } },
        { anonymousToken: { startsWith: `${scope}-anon-` } },
      ],
    },
  });
  await db.blogComment.deleteMany({
    where: {
      author: {
        email: {
          startsWith: `${scope}-`,
        },
      },
    },
  });
  await db.userNotificationPreference.deleteMany({
    where: {
      user: {
        email: {
          startsWith: `${scope}-`,
        },
      },
    },
  });
  await db.user.deleteMany({
    where: {
      email: {
        startsWith: `${scope}-`,
      },
    },
  });
}

export async function createBlogUser(
  scope: string,
  label: string,
  role: "student" | "admin" = "student"
) {
  return db.user.create({
    data: {
      email: makeBlogEmail(scope, label),
      firstName: label,
      role,
    },
  });
}
