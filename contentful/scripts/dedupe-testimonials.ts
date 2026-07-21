import { createClient } from "contentful-management";
import { getContentfulScriptEnv } from "./env.ts";

const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();

const client = createClient({ accessToken: managementToken }, { type: "legacy" });

type ContentfulEntry = {
  sys: {
    id: string;
    createdAt?: string;
  };
  fields: Record<string, Record<string, unknown>>;
  isPublished?: () => boolean;
  unpublish?: () => Promise<ContentfulEntry>;
  delete: () => Promise<void | ContentfulEntry>;
};

type ContentfulEnvironment = {
  getEntries: (
    query: Record<string, unknown>
  ) => Promise<{ items?: ContentfulEntry[]; total?: number }>;
};

function readField(entry: ContentfulEntry, field: string, locale = "en-US") {
  const value = entry.fields[field]?.[locale];
  return typeof value === "string" ? value : "";
}

function canonicalKey(entry: ContentfulEntry) {
  const slug = readField(entry, "slug");
  if (slug) return `slug:${slug.toLowerCase()}`;

  const author = readField(entry, "authorName").toLowerCase().trim();
  const quote = readField(entry, "quote").toLowerCase().trim();
  return `fallback:${author}|${quote}`;
}

function createdAtMs(entry: ContentfulEntry) {
  const iso = entry.sys.createdAt;
  return iso ? new Date(iso).getTime() : Number.MAX_SAFE_INTEGER;
}

async function listAllTestimonials(environment: ContentfulEnvironment) {
  const pageSize = 100;
  const all: ContentfulEntry[] = [];
  let skip = 0;

  while (true) {
    const res = await environment.getEntries({
      content_type: "testimonial",
      limit: pageSize,
      skip,
      order: "sys.createdAt",
    });
    const items = res.items || [];
    all.push(...items);
    skip += items.length;
    if (!items.length || skip >= (res.total || 0)) break;
  }

  return all;
}

async function run() {
  const space = await client.getSpace(spaceId);
  const environment = (await space.getEnvironment(
    environmentId
  )) as unknown as ContentfulEnvironment;

  const entries = await listAllTestimonials(environment);
  const groups = new Map<string, ContentfulEntry[]>();

  for (const entry of entries) {
    const key = canonicalKey(entry);
    const arr = groups.get(key) || [];
    arr.push(entry);
    groups.set(key, arr);
  }

  let removed = 0;
  let groupsDeduped = 0;

  for (const [, group] of groups) {
    if (group.length <= 1) continue;

    groupsDeduped += 1;
    group.sort((a, b) => createdAtMs(a) - createdAtMs(b));
    const keep = group[0];
    const duplicates = group.slice(1);

    for (const duplicate of duplicates) {
      if (duplicate.isPublished && duplicate.isPublished() && duplicate.unpublish) {
        await duplicate.unpublish();
      }
      await duplicate.delete();
      removed += 1;
    }

    console.log(
      `Deduped group: kept ${keep.sys.id}, removed ${duplicates.map((d) => d.sys.id).join(", ")}`
    );
  }

  console.log(
    `Testimonials dedupe complete. scanned=${entries.length}, groupsDeduped=${groupsDeduped}, removed=${removed}`
  );
}

run().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string } | undefined)?.code;
  console.error(`Dedupe failed${code ? ` (${code})` : ""}: ${message}`);
  process.exitCode = 1;
});
