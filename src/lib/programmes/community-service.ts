import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { programmeAccess } from "./access";
import { programmeNow } from "./clock";
const postSchema = z
  .object({
    title: z.string().max(160).default(""),
    body: z.string().trim().min(1).max(10000),
    parentId: z.string().nullable().optional(),
    resourceIds: z.array(z.string()).max(10).default([]),
  })
  .strict();
export async function listProgrammePosts(userId: string, cohortId: string) {
  const access = await programmeAccess(userId, cohortId, "community");
  const posts = await db.programmePost.findMany({
    where: {
      programmeId: access.cohort.id,
      ...(access.staff ? {} : { createdAt: { lte: access.now } }),
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "asc" }],
    take: 300,
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  const resources = access.staff
    ? await db.replayAsset.findMany({
        where: { smallGroupProgrammeId: access.cohort.id, deletedAt: null, status: "ready" },
        select: { id: true, smallGroupProgrammeSession: { select: { title: true } } },
      })
    : [];
  return {
    resources: resources.map((r) => ({
      id: r.id,
      title: r.smallGroupProgrammeSession?.title || "Coach demonstration",
    })),
    staff: access.staff,
    posts: posts.map((post) => ({
      id: post.id,
      parentId: post.parentId,
      title: post.deletedAt ? "Deleted post" : post.title,
      body: post.deletedAt ? "This post was removed." : post.body,
      author: post.author
        ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim()
        : "Shruti",
      own: post.authorId === userId,
      pinned: post.pinned,
      locked: post.locked,
      announcement: post.announcement,
      resourceIds: post.deletedAt || !access.canExercise ? [] : post.resourceIds,
      createdAt: post.createdAt.toISOString(),
      deleted: Boolean(post.deletedAt),
    })),
  };
}
export async function createProgrammePost(userId: string, cohortId: string, raw: unknown) {
  const input = postSchema.parse(raw);
  const access = await programmeAccess(userId, cohortId, "community");
  if (input.resourceIds.length && !access.staff) throw new Error("FORBIDDEN");
  if (input.resourceIds.length) {
    const count = await db.replayAsset.count({
      where: {
        id: { in: input.resourceIds },
        smallGroupProgrammeId: access.cohort.id,
        deletedAt: null,
      },
    });
    if (count !== new Set(input.resourceIds).size) throw new Error("FORBIDDEN");
  }
  return db.$transaction(async (tx) => {
    if (input.parentId) {
      await tx.$queryRaw`SELECT id FROM "ProgrammePost" WHERE id = ${input.parentId} FOR UPDATE`;
      const parent = await tx.programmePost.findFirst({
        where: {
          id: input.parentId,
          programmeId: access.cohort.id,
          deletedAt: null,
          parentId: null,
        },
      });
      if (!parent || (parent.locked && !access.staff)) throw new Error("THREAD_LOCKED");
    }
    return tx.programmePost.create({
      data: {
        ...input,
        programmeId: access.cohort.id,
        authorId: userId,
        createdAt: programmeNow(),
      },
      select: { id: true },
    });
  });
}
export async function changeProgrammePost(
  userId: string,
  cohortId: string,
  postId: string,
  raw: unknown
) {
  const input = z
    .object({
      action: z.enum(["edit", "delete", "pin", "lock", "announce"]),
      body: z.string().trim().min(1).max(10000).optional(),
      value: z.boolean().optional(),
    })
    .strict()
    .parse(raw);
  const access = await programmeAccess(userId, cohortId, "community");
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "ProgrammePost" WHERE id = ${postId} FOR UPDATE`;
    const post = await tx.programmePost.findFirst({
      where: { id: postId, programmeId: access.cohort.id, deletedAt: null },
    });
    if (
      !post ||
      (!access.staff &&
        (post.authorId !== userId || ["pin", "lock", "announce"].includes(input.action)))
    )
      throw new Error("FORBIDDEN");
    if (input.action === "edit" && !input.body) throw new Error("INVALID_INPUT");
    return tx.programmePost.update({
      where: { id: post.id },
      data:
        input.action === "delete"
          ? { deletedAt: programmeNow(), body: "", resourceIds: [] }
          : input.action === "edit"
            ? { body: input.body }
            : input.action === "pin"
              ? { pinned: input.value ?? true }
              : input.action === "announce"
                ? { announcement: input.value ?? true }
                : { locked: input.value ?? true },
      select: { id: true },
    });
  });
}
