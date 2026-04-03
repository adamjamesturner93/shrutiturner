import { db } from "@/lib/db";
import { makeE2eAuthEmail } from "./auth";

export async function seedBlogUser(label: string, role: "student" | "admin" = "student") {
  const email = makeE2eAuthEmail(`blog-${label}`);
  const user = await db.user.create({
    data: {
      email,
      firstName: role === "admin" ? "Admin" : "Taylor",
      lastName: role === "admin" ? "Coach" : "Reader",
      role,
      isOnboarded: true,
    },
  });

  return { email, user };
}

export async function seedBlogCommentThread(postSlug: string, label: string) {
  const { user: author } = await seedBlogUser(`${label}-author`);
  const { user: replier } = await seedBlogUser(`${label}-reply`);
  const topLevelContent = `Top level blog comment ${label}`;
  const replyContent = `Reply to blog comment ${label}`;

  const topLevel = await db.blogComment.create({
    data: {
      postSlug,
      authorUserId: author.id,
      content: topLevelContent,
      status: "visible",
    },
  });

  const reply = await db.blogComment.create({
    data: {
      postSlug,
      authorUserId: replier.id,
      parentId: topLevel.id,
      content: replyContent,
      status: "visible",
    },
  });

  return { topLevel, reply, topLevelContent, replyContent };
}
