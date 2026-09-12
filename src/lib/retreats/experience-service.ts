import "server-only";

import { Prisma, RetreatEventKind } from "@prisma/client";
import { db } from "@/lib/db";
import type { RetreatTemplateContent } from "@/lib/content/types";
import {
  parsePublishableRetreatExperienceContent,
  parseRetreatExperienceContent,
} from "@/lib/retreats/experience-schema";
import { getRetreatFormat } from "@/lib/retreats/format-service";

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function throwExperienceWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new Error("EXPERIENCE_SLUG_TAKEN");
  }
  throw error;
}

export function createRetreatSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function serializeExperience(experience: {
  id: string;
  slug: string;
  title: string;
  eventKind: RetreatEventKind;
  formatPresetId: string | null;
  draftContentJson: Prisma.JsonValue;
  publishedContentJson: Prisma.JsonValue | null;
  revision: number;
  publishedRevision: number | null;
  publishedAt: Date | null;
  sourceContentfulEntryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: experience.id,
    slug: experience.slug,
    title: experience.title,
    eventKind: experience.eventKind,
    formatPresetId: experience.formatPresetId,
    draftContent: parseRetreatExperienceContent(experience.draftContentJson),
    publishedContent: experience.publishedContentJson
      ? parseRetreatExperienceContent(experience.publishedContentJson)
      : null,
    revision: experience.revision,
    publishedRevision: experience.publishedRevision,
    publishedAt: experience.publishedAt?.toISOString() || null,
    sourceContentfulEntryId: experience.sourceContentfulEntryId,
    hasUnpublishedChanges: experience.publishedRevision !== experience.revision,
    createdAt: experience.createdAt.toISOString(),
    updatedAt: experience.updatedAt.toISOString(),
  };
}

export async function listRetreatExperiences(options?: { publishedOnly?: boolean }) {
  const experiences = await db.retreatExperience.findMany({
    where: options?.publishedOnly ? { publishedAt: { not: null } } : undefined,
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
  });
  return experiences.map(serializeExperience);
}

export async function getRetreatExperience(id: string, client: Prisma.TransactionClient = db) {
  const experience = await client.retreatExperience.findUnique({ where: { id } });
  return experience ? serializeExperience(experience) : null;
}

export async function getPublishedRetreatExperienceBySlug(slug: string) {
  const experience = await db.retreatExperience.findUnique({ where: { slug } });
  if (!experience?.publishedContentJson || !experience.publishedAt) return null;
  return serializeExperience(experience);
}

function markdownToSchedule(markdown: string) {
  const activities = markdown
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*+]\s+|#{1,6}\s+)/, "").trim())
    .filter(Boolean);
  return activities.length ? [{ day: "Schedule", title: "What we'll do", activities }] : [];
}

function toTemplate(experience: Awaited<ReturnType<typeof getPublishedRetreatExperienceBySlug>>) {
  if (!experience?.publishedContent) return null;
  const content = experience.publishedContent;
  const experienceType: RetreatTemplateContent["experienceType"] = experience.eventKind;
  const deliveryMode: RetreatTemplateContent["deliveryMode"] =
    experience.eventKind === RetreatEventKind.online_workshop ? "online_live" : "in_person";
  return {
    id: experience.id,
    slug: experience.slug,
    title: content.title,
    subtitle: content.subtitle || content.shortDescription,
    shortDescription: content.shortDescription,
    fullDescription: content.fullDescription,
    atmosphereDescription: content.atmosphereDescription || undefined,
    experienceType,
    deliveryMode,
    durationLabel: content.durationLabel || undefined,
    audienceDescription: content.audienceDescription || undefined,
    experienceLevel: content.experienceLevel || undefined,
    suitableFor: content.suitableFor,
    included: content.included,
    notIncluded: content.notIncluded,
    whatToBring: content.whatToBring,
    foodAndDrinkDescription: content.foodAndDrinkDescription || undefined,
    schedule: markdownToSchedule(content.scheduleMarkdown),
    scheduleMarkdown: content.scheduleMarkdown,
    accommodationDescription: content.accommodationDescription || undefined,
    imageUrl: content.image?.url,
    imageAlt: content.image?.alt,
    imageFocalPoint: content.image?.focalPoint,
    seoTitle: content.seoTitle || undefined,
    seoDescription: content.seoDescription || undefined,
  } satisfies RetreatTemplateContent;
}

export async function getPublishedRetreatExperienceTemplateBySlug(slug: string) {
  return toTemplate(await getPublishedRetreatExperienceBySlug(slug));
}

export async function getPublishedRetreatExperienceTemplateById(id: string) {
  const experience = await getRetreatExperience(id);
  return experience?.publishedAt ? toTemplate(experience) : null;
}

export async function listPublishedRetreatExperienceTemplates() {
  const experiences = await listRetreatExperiences({ publishedOnly: true });
  const templates: RetreatTemplateContent[] = [];
  for (const experience of experiences) {
    if (!experience.publishedContent) continue;
    const content = experience.publishedContent;
    templates.push({
      id: experience.id,
      slug: experience.slug,
      title: content.title,
      subtitle: content.subtitle || content.shortDescription,
      shortDescription: content.shortDescription,
      fullDescription: content.fullDescription,
      atmosphereDescription: content.atmosphereDescription || undefined,
      experienceType: experience.eventKind,
      deliveryMode:
        experience.eventKind === RetreatEventKind.online_workshop
          ? ("online_live" as const)
          : ("in_person" as const),
      durationLabel: content.durationLabel || undefined,
      audienceDescription: content.audienceDescription || undefined,
      experienceLevel: content.experienceLevel || undefined,
      suitableFor: content.suitableFor,
      included: content.included,
      notIncluded: content.notIncluded,
      whatToBring: content.whatToBring,
      foodAndDrinkDescription: content.foodAndDrinkDescription || undefined,
      schedule: markdownToSchedule(content.scheduleMarkdown),
      scheduleMarkdown: content.scheduleMarkdown,
      accommodationDescription: content.accommodationDescription || undefined,
      imageUrl: content.image?.url,
      imageAlt: content.image?.alt,
      imageFocalPoint: content.image?.focalPoint,
      seoTitle: content.seoTitle || undefined,
      seoDescription: content.seoDescription || undefined,
    });
  }
  return templates;
}

export async function createRetreatExperience(input: {
  title: string;
  slug?: string;
  eventKind?: RetreatEventKind;
  formatPresetId?: string | null;
  content?: unknown;
}, client: Prisma.TransactionClient = db) {
  const title = input.title.trim();
  if (!title) throw new Error("EXPERIENCE_TITLE_REQUIRED");
  const format = input.formatPresetId ? await getRetreatFormat(input.formatPresetId, client) : null;
  if (input.formatPresetId && !format) throw new Error("FORMAT_NOT_FOUND");
  const eventKind = input.eventKind || format?.eventKind;
  if (!eventKind) throw new Error("EVENT_KIND_REQUIRED");
  if (format && format.eventKind !== eventKind) throw new Error("FORMAT_KIND_MISMATCH");
  const content = parseRetreatExperienceContent(
    input.content || {
      ...(format?.starterContent || {}),
      title,
    }
  );
  const slug = createRetreatSlug(input.slug || title);
  if (!slug) throw new Error("EXPERIENCE_SLUG_REQUIRED");
  let experience: Awaited<ReturnType<typeof db.retreatExperience.create>>;
  try {
    experience = await client.retreatExperience.create({
      data: {
        title: content.title,
        slug,
        eventKind,
        formatPresetId: format?.id || null,
        draftContentJson: json(content),
      },
    });
  } catch (error) {
    throwExperienceWriteError(error);
  }
  return serializeExperience(experience);
}

export async function updateRetreatExperience(input: {
  id: string;
  revision: number;
  slug?: string;
  content: unknown;
}) {
  const existing = await db.retreatExperience.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("EXPERIENCE_NOT_FOUND");
  if (existing.revision !== input.revision) throw new Error("REVISION_CONFLICT");
  const content = parseRetreatExperienceContent(input.content);
  const requestedSlug = createRetreatSlug(input.slug || existing.slug);
  if (!requestedSlug) throw new Error("EXPERIENCE_SLUG_REQUIRED");
  if (existing.publishedAt && requestedSlug !== existing.slug) {
    throw new Error("PUBLISHED_SLUG_LOCKED");
  }
  let result: Awaited<ReturnType<typeof db.retreatExperience.updateMany>>;
  try {
    result = await db.$transaction(async (tx) => {
    const updated = await tx.retreatExperience.updateMany({
      where: { id: input.id, revision: input.revision, publishedAt: existing.publishedAt },
      data: {
        title: content.title,
        slug: requestedSlug,
        draftContentJson: json(content),
        revision: { increment: 1 },
      },
    });
    if (!updated.count) throw new Error("REVISION_CONFLICT");
    if (requestedSlug !== existing.slug) {
      await tx.retreatDate.updateMany({
        where: { experienceId: input.id },
        data: { retreatSlug: requestedSlug },
      });
    }
    return updated;
    });
  } catch (error) {
    throwExperienceWriteError(error);
  }
  if (result.count === 0) throw new Error("REVISION_CONFLICT");
  return getRetreatExperience(input.id);
}

export async function publishRetreatExperience(input: { id: string; revision: number }) {
  const existing = await db.retreatExperience.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("EXPERIENCE_NOT_FOUND");
  if (existing.revision !== input.revision) throw new Error("REVISION_CONFLICT");
  parsePublishableRetreatExperienceContent(existing.draftContentJson);
  const result = await db.retreatExperience.updateMany({
    where: { id: input.id, revision: input.revision },
    data: {
      publishedContentJson: existing.draftContentJson,
      publishedRevision: existing.revision,
      publishedAt: new Date(),
    },
  });
  if (result.count === 0) throw new Error("REVISION_CONFLICT");
  return getRetreatExperience(input.id);
}
