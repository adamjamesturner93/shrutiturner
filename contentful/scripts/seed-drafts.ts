import { SEED_GROUPS } from "../seed/public-seed.ts";
import contentfulManagement from "contentful-management";
import { getContentfulScriptEnv } from "./env.ts";

const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();
const { createClient } = contentfulManagement;

const client = createClient({ accessToken: managementToken });

type ContentfulEntry = {
  sys: { id: string };
  fields: Record<string, Record<string, unknown>>;
  update: () => Promise<ContentfulEntry>;
};

type ContentfulEnvironment = {
  getEntries: (query: Record<string, unknown>) => Promise<{ items?: ContentfulEntry[] }>;
  createEntry: (
    contentType: string,
    payload: { fields: Record<string, Record<string, unknown>> }
  ) => Promise<ContentfulEntry>;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildAutoSlug(contentType: string, entry: Record<string, unknown>) {
  const existingSlug = typeof entry.slug === "string" ? entry.slug.trim() : "";
  if (existingSlug) return existingSlug;

  const byType: Record<string, string | undefined> = {
    instructorProfile: typeof entry.name === "string" ? entry.name : undefined,
    testimonial:
      typeof entry.authorName === "string"
        ? `testimonial-${entry.authorName}-${String(entry.service || "general")}`
        : undefined,
    classDefinition: typeof entry.name === "string" ? entry.name : undefined,
    retreatVenue: typeof entry.name === "string" ? entry.name : undefined,
    retreatTemplate: typeof entry.title === "string" ? entry.title : undefined,
    blogPost: typeof entry.title === "string" ? entry.title : undefined,
    legalDocument: typeof entry.title === "string" ? entry.title : undefined,
    faqItem: typeof entry.question === "string" ? entry.question : undefined,
    trustBadge: typeof entry.title === "string" ? entry.title : undefined,
    contactBlock: typeof entry.title === "string" ? entry.title : undefined,
    announcementBanner: typeof entry.message === "string" ? entry.message : undefined,
    leadMagnet: typeof entry.title === "string" ? entry.title : undefined,
    newsletterTemplate: typeof entry.title === "string" ? entry.title : undefined,
    transactionalEmailTemplate:
      typeof entry.templateKey === "string" ? entry.templateKey : undefined,
  };

  const candidate = byType[contentType];
  return candidate ? slugify(candidate) : undefined;
}

function normalizeEntryFields(entry: Record<string, unknown>, locale = "en-US") {
  const fields: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(entry)) {
    fields[k] = { [locale]: v };
  }
  return fields;
}

function toEntryLink(id: string) {
  return {
    sys: {
      type: "Link",
      linkType: "Entry",
      id,
    },
  };
}

async function findExistingEntry(
  environment: ContentfulEnvironment,
  contentType: string,
  slug?: string,
  entry?: Record<string, unknown>
) {
  if (slug) {
    const response = await environment.getEntries({
      content_type: contentType,
      "fields.slug": slug,
      limit: 1,
    });

    if (response.items?.[0]) {
      return response.items[0];
    }
  }

  // Legacy seed compatibility: some types were initially seeded without slugs.
  if (contentType === "testimonial") {
    const authorName = typeof entry?.authorName === "string" ? entry.authorName : undefined;
    const quote = typeof entry?.quote === "string" ? entry.quote : undefined;
    if (authorName && quote) {
      const response = await environment.getEntries({
        content_type: contentType,
        "fields.authorName": authorName,
        "fields.quote": quote,
        limit: 1,
      });
      if (response.items?.[0]) {
        return response.items[0];
      }
    }
  }

  return null;
}

async function upsertDraftEntry(
  environment: ContentfulEnvironment,
  contentType: string,
  entry: Record<string, unknown>
) {
  const autoSlug = buildAutoSlug(contentType, entry);
  const normalizedEntry = autoSlug && !entry.slug ? { ...entry, slug: autoSlug } : entry;
  const slug = typeof normalizedEntry.slug === "string" ? normalizedEntry.slug : undefined;
  const existing = await findExistingEntry(environment, contentType, slug, normalizedEntry);

  if (existing) {
    existing.fields = normalizeEntryFields(normalizedEntry);
    await existing.update();

    return { action: "updated", id: existing.sys.id };
  }

  const created = await environment.createEntry(contentType, {
    fields: normalizeEntryFields(normalizedEntry),
  });

  return { action: "created", id: created.sys.id };
}

async function getEntryIdBySlug(
  environment: ContentfulEnvironment,
  contentType: string,
  slug: string
) {
  const existing = await findExistingEntry(environment, contentType, slug);
  return existing?.sys?.id ? String(existing.sys.id) : null;
}

async function run() {
  const space = await client.getSpace(spaceId);
  const environment = (await space.getEnvironment(environmentId)) as ContentfulEnvironment;

  const report: Record<string, { created: number; updated: number }> = {};

  // Seed all groups except groups requiring link resolution first.
  for (const group of SEED_GROUPS.filter(
    (g) =>
      g.contentType !== "retreatTemplate" &&
      g.contentType !== "newsletterSignupContent" &&
      g.contentType !== "classDefinition"
  )) {
    report[group.contentType] = { created: 0, updated: 0 };
    for (const entry of group.entries) {
      const result = await upsertDraftEntry(
        environment,
        group.contentType,
        entry as Record<string, unknown>
      );
      report[group.contentType][result.action as "created" | "updated"] += 1;
    }
  }

  const classDefinitionGroup = SEED_GROUPS.find((g) => g.contentType === "classDefinition");
  if (classDefinitionGroup) {
    report.classDefinition = { created: 0, updated: 0 };

    for (const rawEntry of classDefinitionGroup.entries) {
      const entry = rawEntry as Record<string, unknown> & { defaultInstructorProfileSlug?: string };
      const { defaultInstructorProfileSlug, ...rest } = entry;

      let defaultInstructorProfile: ReturnType<typeof toEntryLink> | undefined;
      if (
        typeof defaultInstructorProfileSlug === "string" &&
        defaultInstructorProfileSlug.length > 0
      ) {
        const profileId = await getEntryIdBySlug(
          environment,
          "instructorProfile",
          defaultInstructorProfileSlug
        );
        if (!profileId) {
          throw new Error(
            `Unable to resolve instructorProfile by slug "${defaultInstructorProfileSlug}" for class definition "${String(entry.slug || "")}".`
          );
        }
        defaultInstructorProfile = toEntryLink(profileId);
      }

      const result = await upsertDraftEntry(environment, "classDefinition", {
        ...rest,
        ...(defaultInstructorProfile ? { defaultInstructorProfile } : {}),
      });
      report.classDefinition[result.action as "created" | "updated"] += 1;
    }
  }

  const newsletterSignupGroup = SEED_GROUPS.find((g) => g.contentType === "newsletterSignupContent");
  if (newsletterSignupGroup) {
    report.newsletterSignupContent = { created: 0, updated: 0 };

    for (const rawEntry of newsletterSignupGroup.entries) {
      const entry = rawEntry as Record<string, unknown> & { activeLeadMagnetSlug?: string };
      const { activeLeadMagnetSlug, ...rest } = entry;

      let activeLeadMagnet: ReturnType<typeof toEntryLink> | undefined;
      if (typeof activeLeadMagnetSlug === "string" && activeLeadMagnetSlug.length > 0) {
        const leadMagnetId = await getEntryIdBySlug(environment, "leadMagnet", activeLeadMagnetSlug);
        if (!leadMagnetId) {
          throw new Error(
            `Unable to resolve leadMagnet by slug "${activeLeadMagnetSlug}" for newsletter signup "${String(entry.slug || "")}".`
          );
        }
        activeLeadMagnet = toEntryLink(leadMagnetId);
      }

      const result = await upsertDraftEntry(environment, "newsletterSignupContent", {
        ...rest,
        ...(activeLeadMagnet ? { activeLeadMagnet } : {}),
      });
      report.newsletterSignupContent[result.action as "created" | "updated"] += 1;
    }
  }

  const retreatTemplateGroup = SEED_GROUPS.find((g) => g.contentType === "retreatTemplate");
  if (retreatTemplateGroup) {
    report.retreatTemplate = { created: 0, updated: 0 };

    for (const rawEntry of retreatTemplateGroup.entries) {
      const entry = rawEntry as Record<string, unknown> & { venueSlug?: string };
      const { venueSlug, ...rest } = entry;

      let venue: ReturnType<typeof toEntryLink> | undefined;
      if (typeof venueSlug === "string" && venueSlug.length > 0) {
        const venueId = await getEntryIdBySlug(environment, "retreatVenue", venueSlug);
        if (!venueId) {
          throw new Error(
            `Unable to resolve retreatVenue by slug "${venueSlug}" for retreat template "${String(entry.slug || "")}".`
          );
        }
        venue = toEntryLink(venueId);
      }

      const result = await upsertDraftEntry(environment, "retreatTemplate", {
        ...rest,
        ...(venue ? { venue } : {}),
      });
      report.retreatTemplate[result.action as "created" | "updated"] += 1;
    }
  }

  console.log("Draft seed completed:");
  console.table(report);
}

run().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string } | undefined)?.code;
  console.error(`Seed failed${code ? ` (${code})` : ""}: ${message}`);
  process.exitCode = 1;
});
