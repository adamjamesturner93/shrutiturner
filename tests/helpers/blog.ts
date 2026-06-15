import type { UserRole } from "@prisma/client";
import { db } from "./db";
import { createBlogUser } from "./blog-fixtures";
import { sanitizeSegment, uniqueToken } from "./_shared";

export async function seedBlogUser(label: string, role: UserRole = "member") {
  return createBlogUser(`e2e-${label}`, label, role);
}

export async function seedBlogCommentThread(postSlug: string, label: string) {
  const author = await seedBlogUser(`${label}-author`);
  const topLevelContent = `E2E comment ${sanitizeSegment(label) || "thread"} ${uniqueToken("top-level")}`;

  const topLevel = await db.blogComment.create({
    data: {
      postSlug,
      authorUserId: author.id,
      content: topLevelContent,
    },
  });

  const reply = await db.blogComment.create({
    data: {
      postSlug,
      authorUserId: author.id,
      parentId: topLevel.id,
      content: `Reply ${uniqueToken(label)}`,
    },
  });

  return {
    author,
    topLevel,
    reply,
    topLevelContent,
  };
}
