import { Prisma, PrismaClient, RetreatEventKind } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "contentful-management";
import { readFileSync } from "node:fs";
import {
  contentHash,
  planExperienceImport,
  importConversionWarnings,
  assertReviewedImportUpdate,
  type ReviewedImportUpdate,
} from "./lib/retreat-experience-import.ts";
import { getContentfulScriptEnv } from "../contentful/scripts/env.ts";

const apply = process.argv.includes("--apply");
const reviewFile = process.argv.find((argument) => argument.startsWith("--reviewed-updates="))?.split("=").slice(1).join("=");
const reviewedUpdates: Record<string, ReviewedImportUpdate> = reviewFile ? JSON.parse(readFileSync(reviewFile, "utf8")) : {};
if (!reviewedUpdates || typeof reviewedUpdates !== "object" || Array.isArray(reviewedUpdates)) throw new Error("INVALID_REVIEW_MANIFEST");
const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DIRECT_URL or DATABASE_URL.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const client = createClient({ accessToken: managementToken }, { type: "legacy" });

function field<T>(fields: Record<string, Record<string, unknown>>, id: string, locale: string) {
  return fields[id]?.[locale] as T | undefined;
}

function text(fields: Record<string, Record<string, unknown>>, id: string, locale: string) {
  const value = field<unknown>(fields, id, locale);
  return typeof value === "string" ? value.trim() : "";
}

function strings(fields: Record<string, Record<string, unknown>>, id: string, locale: string) {
  const value = field<unknown>(fields, id, locale);
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

function eventKind(value: string): RetreatEventKind {
  if (value === "day_retreat") return RetreatEventKind.day_retreat;
  if (value === "in_person_workshop") return RetreatEventKind.in_person_workshop;
  if (value === "online_workshop" || value === "course") {
    return RetreatEventKind.online_workshop;
  }
  return RetreatEventKind.residential_retreat;
}

function formatId(kind: RetreatEventKind) {
  return `format_${kind === RetreatEventKind.online_workshop ? "online_workshop_150" : kind}`;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function defaultFocalPoint(url: string) {
  const path = url.split("?")[0];
  if (path === "/images/shruti-hiking-selfie.jpeg") return { x: 50, y: 68 };
  if (path === "/images/shruti-coaching.jpeg") return { x: 50, y: 0 };
  return { x: 50, y: 50 };
}

function legacyScheduleToMarkdown(value: unknown) {
  if (typeof value === "string") return value.trim();
  const candidates = Array.isArray(value)
    ? value
    : value && typeof value === "object" && "days" in value
      ? (value as { days?: unknown }).days
      : [];
  if (!Array.isArray(candidates)) return "";
  const sections: string[] = [];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const row = candidate as Record<string, unknown>;
    const heading = [row.title, row.day, row.heading].find(
      (item): item is string => typeof item === "string" && Boolean(item.trim())
    );
    const subtitle = typeof row.subtitle === "string" ? row.subtitle.trim() : "";
    const activities = Array.isArray(row.activities)
      ? row.activities.filter((item): item is string => typeof item === "string")
      : typeof row.activities === "string"
        ? row.activities.split(/\r?\n/)
        : [];
    if (heading) sections.push(`## ${heading.trim()}`);
    if (subtitle) sections.push(`_${subtitle}_`);
    if (activities.length) {
      sections.push(
        activities
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => (item.match(/^[-*+]\s/) ? item : `- ${item}`))
          .join("\n")
      );
    }
  }
  return sections.join("\n\n");
}

async function run() {
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);
  const locales = await environment.getLocales();
  const locale = locales.items.find((item) => item.default)?.code;
  if (!locale) throw new Error("Contentful has no default locale.");

  const response = await environment.getEntries({ content_type: "retreatTemplate", limit: 1000 });
  if (response.total > response.items.length) throw new Error("IMPORT_REQUIRES_PAGINATION");
  const deliveryToken = process.env.CONTENTFUL_DELIVERY_TOKEN;
  if (!deliveryToken)
    throw new Error("CONTENTFUL_DELIVERY_TOKEN is required to verify published content.");
  async function publishedResource(type: "entries" | "assets", id: string) {
    const url = `https://cdn.contentful.com/spaces/${encodeURIComponent(spaceId)}/environments/${encodeURIComponent(environmentId)}/${type}/${encodeURIComponent(id)}?locale=*`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${deliveryToken}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(`PUBLISHED_SNAPSHOT_UNAVAILABLE:${type}:${id}:${response.status}`);
    return (await response.json()) as {
      sys: { id: string };
      fields: Record<string, Record<string, unknown>>;
    };
  }
  const publishedSource = {
    getEntry: (id: string) => publishedResource("entries", id),
    getAsset: (id: string) => publishedResource("assets", id),
  };
  const rows: Array<{
    entryId: string;
    slug: string;
    title: string;
    published: boolean;
    kind: RetreatEventKind;
    content: Record<string, unknown>;
    hash: string;
    publishedContent: Record<string, unknown> | null;
    publishedHash: string | null;
    conversionWarnings: string[];
  }> = [];

  for (const entry of response.items) {
    async function transform(source: "draft" | "published") {
      const sourceEntry = source === "draft" ? entry : await publishedSource.getEntry(entry.sys.id);
      const fields = sourceEntry.fields as Record<string, Record<string, unknown>>;
      const slug = text(fields, "slug", locale);
      const title = text(fields, "title", locale);
      if (!slug || !title)
        throw new Error(`IMPORT_MISSING_TITLE_OR_SLUG:${entry.sys.id}:${source}`);
      const kind = eventKind(text(fields, "experienceType", locale));
      const scheduleLinks =
        field<Array<{ sys?: { id?: string } }>>(fields, "scheduleDays", locale) || [];
      const scheduleSections: string[] = [];
      for (const link of scheduleLinks) {
        if (!link.sys?.id) continue;
        const scheduleEntry =
          source === "draft"
            ? await environment.getEntry(link.sys.id)
            : await publishedSource.getEntry(link.sys.id);
        const scheduleFields = scheduleEntry.fields as Record<string, Record<string, unknown>>;
        const heading = text(scheduleFields, "title", locale);
        const subtitle = text(scheduleFields, "subtitle", locale);
        const activities = text(scheduleFields, "activities", locale);
        if (heading) scheduleSections.push(`## ${heading}`);
        if (subtitle) scheduleSections.push(`_${subtitle}_`);
        if (activities) {
          scheduleSections.push(
            activities
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => (line.match(/^[-*+]\s/) ? line : `- ${line}`))
              .join("\n")
          );
        }
      }

      let image:
        | { assetId: string; url: string; alt: string; focalPoint: { x: number; y: number } }
        | undefined;
      const heroLink = field<{ sys?: { id?: string } }>(fields, "heroImage", locale);
      if (heroLink?.sys?.id) {
        const asset =
          source === "draft"
            ? await environment.getAsset(heroLink.sys.id)
            : await publishedSource.getAsset(heroLink.sys.id);
        const assetFields = asset.fields as Record<string, Record<string, unknown>>;
        const file = field<{ url?: string }>(assetFields, "file", locale);
        const url = file?.url ? (file.url.startsWith("//") ? `https:${file.url}` : file.url) : "";
        if (url) {
          image = {
            assetId: asset.sys.id,
            url,
            alt:
              text(assetFields, "description", locale) ||
              text(assetFields, "title", locale) ||
              title,
            focalPoint: defaultFocalPoint(url),
          };
        }
      }
      if (!image) {
        const url = text(fields, "heroImageUrl", locale);
        if (url) image = { assetId: "", url, alt: title, focalPoint: defaultFocalPoint(url) };
      }

      const content = {
        schemaVersion: 1,
        title,
        subtitle: text(fields, "subtitle", locale),
        shortDescription: text(fields, "shortDescription", locale),
        fullDescription: text(fields, "fullDescription", locale),
        scheduleMarkdown:
          scheduleSections.join("\n\n") ||
          legacyScheduleToMarkdown(field<unknown>(fields, "schedule", locale)),
        atmosphereDescription: text(fields, "atmosphereDescription", locale),
        audienceDescription: text(fields, "audienceDescription", locale),
        experienceLevel: text(fields, "experienceLevel", locale),
        suitableFor: strings(fields, "suitableFor", locale),
        included: strings(fields, "included", locale),
        notIncluded: strings(fields, "notIncluded", locale),
        whatToBring: strings(fields, "whatToBring", locale),
        foodAndDrinkDescription: text(fields, "foodAndDrinkDescription", locale),
        accommodationDescription: text(fields, "accommodationDescription", locale),
        durationLabel: text(fields, "durationLabel", locale),
        image,
        gallery: [],
        seoTitle: text(fields, "seoTitle", locale),
        seoDescription: text(fields, "seoDescription", locale),
      };
      return {
        slug,
        title,
        kind,
        content,
        hash: contentHash(content),
        conversionWarnings: importConversionWarnings(fields, locale).map(
          (warning) => `${source}:${warning}`
        ),
      };
    }
    const draft = await transform("draft");
    const published =
      typeof entry.sys.publishedVersion === "number" ? await transform("published") : null;
    if (published && (published.slug !== draft.slug || published.kind !== draft.kind)) {
      throw new Error(`IMPORT_IDENTITY_CHANGED_REQUIRES_REVIEW:${entry.sys.id}`);
    }
    rows.push({
      entryId: entry.sys.id,
      ...draft,
      published: Boolean(published),
      publishedContent: published?.content || null,
      publishedHash: published?.hash || null,
      conversionWarnings: [...draft.conversionWarnings, ...(published?.conversionWarnings || [])],
    });
  }

  const plans = await Promise.all(
    rows.map(async (row) => {
      const existing = await prisma.retreatExperience.findUnique({
        where: { sourceContentfulEntryId: row.entryId },
      });
      const slugOwner = await prisma.retreatExperience.findUnique({ where: { slug: row.slug } });
      const datesToLink = await prisma.retreatDate.count({
        where: { retreatSlug: row.slug, experienceId: null },
      });
      return {
        row,
        existing,
        action: planExperienceImport({
          entryId: row.entryId,
          spaceId,
          environment: environmentId,
          locale,
          existing,
          slugCollision: Boolean(slugOwner && slugOwner.id !== existing?.id),
          draftHash: row.hash,
          publishedHash: row.publishedHash,
        }),
        datesToLink,
      };
    })
  );

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        contentfulEnvironment: environmentId,
        locale,
        entries: plans.map(({ row, existing, action, datesToLink }) => ({
          entryId: row.entryId,
          slug: row.slug,
          title: row.title,
          published: row.published,
          kind: row.kind,
          hash: row.hash,
          publishedHash: row.publishedHash,
          appRevision: existing?.revision || null,
          appDraftHash: existing ? contentHash(existing.draftContentJson) : null,
          conversionWarnings: row.conversionWarnings,
          databaseAction: action,
          existingExperienceId: existing?.id || null,
          datesToLink,
        })),
      },
      null,
      2
    )
  );
  if (!apply) return;
  if (plans.some(({ row }) => row.conversionWarnings.length > 0)) {
    throw new Error(
      "IMPORT_CONVERSION_LOSS_REQUIRES_REVIEW: No records were changed. Review unsupported fields and additional locales."
    );
  }
  if (plans.some(({ action, row }) => action !== "create" && action !== "unchanged" &&
    !(action === "source_changed_requires_review" && reviewedUpdates[row.entryId]))) {
    throw new Error("IMPORT_CONFLICTS_REQUIRE_REVIEW: No records were changed.");
  }

  // Validate every approval before writing anything. A reviewed update changes only the app draft;
  // published content, dates, inventory and booking links remain untouched.
  for (const { row, action, existing } of plans) {
    if (action === "source_changed_requires_review" && existing) {
      assertReviewedImportUpdate(reviewedUpdates[row.entryId], existing, row);
      if (existing.slug !== row.slug || existing.eventKind !== row.kind) throw new Error("REVIEWED_IMPORT_IDENTITY_CHANGED");
    }
  }
  for (const { row, action, existing } of plans) {
    // A no-op must also leave app-owned date links untouched.
    if (action === "unchanged") continue;
    if (action === "source_changed_requires_review" && existing) {
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "RetreatExperience" WHERE "id" = ${existing.id} FOR UPDATE`;
        const current = await tx.retreatExperience.findUniqueOrThrow({ where: { id: existing.id } });
        assertReviewedImportUpdate(reviewedUpdates[row.entryId], current, row);
        await tx.retreatExperience.update({ where: { id: current.id }, data: {
          title: row.title, draftContentJson: asJson(row.content), revision: { increment: 1 },
          sourceContentfulHash: row.hash, sourceContentfulPublishedHash: row.publishedHash,
        } });
      });
      continue;
    }
    await prisma.$transaction(async (tx) => {
      const experience = await tx.retreatExperience.create({
        data: {
          slug: row.slug,
          title: row.title,
          eventKind: row.kind,
          formatPresetId: formatId(row.kind),
          draftContentJson: asJson(row.content),
          publishedContentJson: row.publishedContent ? asJson(row.publishedContent) : undefined,
          publishedAt: row.published ? new Date() : undefined,
          publishedRevision: row.published ? (row.hash === row.publishedHash ? 1 : 0) : undefined,
          sourceContentfulEntryId: row.entryId,
          sourceContentfulHash: row.hash,
          sourceContentfulLocale: locale,
          sourceContentfulSpaceId: spaceId,
          sourceContentfulEnvironment: environmentId,
          sourceContentfulPublishedHash: row.publishedHash,
        },
      });
      await tx.retreatDate.updateMany({
        where: { retreatSlug: row.slug, experienceId: null },
        data: {
          experienceId: experience.id,
          eventKind: row.kind,
          formatPresetId: formatId(row.kind),
        },
      });
    });
  }
}

try {
  await run();
} finally {
  await prisma.$disconnect();
}
