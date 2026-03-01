import { SEED_GROUPS } from "../seed/public-seed.ts";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || "master";
const MANAGEMENT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

if (!SPACE_ID || !MANAGEMENT_TOKEN) {
  throw new Error("Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN");
}

const baseUrl = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT}`;

async function cma(path: string, init?: RequestInit) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${MANAGEMENT_TOKEN}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`CMA request failed (${res.status}): ${text}`);
  }

  return res;
}

function normalizeEntryFields(entry: Record<string, unknown>) {
  const fields: Record<string, { "en-US": unknown }> = {};
  for (const [k, v] of Object.entries(entry)) {
    fields[k] = { "en-US": v };
  }
  return fields;
}

async function findExistingEntry(contentType: string, slug?: string) {
  if (!slug) return null;

  const params = new URLSearchParams({ content_type: contentType, "fields.slug": slug, limit: "1" });
  const res = await cma(`/entries?${params.toString()}`);
  const json = await res.json();
  return json.items?.[0] || null;
}

async function upsertDraftEntry(contentType: string, entry: Record<string, unknown>) {
  const slug = typeof entry.slug === "string" ? entry.slug : undefined;
  const existing = await findExistingEntry(contentType, slug);

  if (existing) {
    const version = existing.sys?.version;
    const updateRes = await cma(`/entries/${existing.sys.id}`, {
      method: "PUT",
      headers: {
        "X-Contentful-Version": String(version),
        "X-Contentful-Content-Type": contentType,
      },
      body: JSON.stringify({ fields: normalizeEntryFields(entry) }),
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to update entry ${contentType}:${slug}`);
    }

    return { action: "updated", id: existing.sys.id };
  }

  const createRes = await cma(`/entries`, {
    method: "POST",
    headers: { "X-Contentful-Content-Type": contentType },
    body: JSON.stringify({ fields: normalizeEntryFields(entry) }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create entry in ${contentType}`);
  }

  const created = await createRes.json();
  return { action: "created", id: created.sys.id };
}

async function run() {
  const report: Record<string, { created: number; updated: number }> = {};

  for (const group of SEED_GROUPS) {
    report[group.contentType] = { created: 0, updated: 0 };
    for (const entry of group.entries) {
      const result = await upsertDraftEntry(group.contentType, entry as Record<string, unknown>);
      report[group.contentType][result.action as "created" | "updated"] += 1;
    }
  }

  console.log("Draft seed completed:");
  console.table(report);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
