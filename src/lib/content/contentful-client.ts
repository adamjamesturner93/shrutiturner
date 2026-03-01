import { getContentfulConfig } from "./config";

type EntryEnvelope<T> = { sys: { id: string }; fields: T };

type EntriesResponse<T> = {
  items: Array<EntryEnvelope<T>>;
  includes?: {
    Entry?: Array<EntryEnvelope<Record<string, unknown>>>;
    Asset?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
  };
};

function toQueryString(query: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

function getCacheTags(contentType?: string): string[] {
  const base = ["content:all"];

  if (!contentType) {
    return base;
  }

  if (contentType === "blogPost") return [...base, "content:blog"];
  if (contentType === "classDefinition") return [...base, "content:classes", "content:schedule"];
  if (contentType === "retreatTemplate" || contentType === "retreatVenue") {
    return [...base, "content:retreats"];
  }
  if (contentType === "pageContent") return [...base, "content:pages"];
  if (contentType === "globalContent") return [...base, "content:global"];

  return base;
}

async function cdaFetch<T>(path: string, query: Record<string, string | number | boolean | undefined> = {}) {
  const cfg = getContentfulConfig();
  if (!cfg) {
    return null;
  }

  const qs = toQueryString(query);
  const url = `https://cdn.contentful.com/spaces/${cfg.spaceId}/environments/${cfg.environment}${path}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cfg.deliveryToken}`,
      "Content-Type": "application/json",
    },
    next: {
      revalidate: 60,
      tags: getCacheTags(typeof query.content_type === "string" ? query.content_type : undefined),
    },
  });

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as T;
}

export async function getEntries<TFields>(
  contentType: string,
  query: Record<string, string | number | boolean | undefined> = {}
): Promise<EntriesResponse<TFields> | null> {
  return cdaFetch<EntriesResponse<TFields>>("/entries", {
    content_type: contentType,
    ...query,
  });
}

export async function getEntryBySlug<TFields>(
  contentType: string,
  slug: string,
  slugField = "slug"
): Promise<EntryEnvelope<TFields> | null> {
  const res = await getEntries<TFields>(contentType, {
    [`fields.${slugField}`]: slug,
    limit: 1,
  });

  return res?.items?.[0] ?? null;
}
