import { getContentfulConfig } from "./config";

type EntryEnvelope<T> = {
  sys: {
    id: string;
    publishedAt?: string;
    updatedAt?: string;
    createdAt?: string;
  };
  fields: T;
};

type EntriesResponse<T> = {
  items: Array<EntryEnvelope<T>>;
  includes?: {
    Entry?: Array<EntryEnvelope<Record<string, unknown>>>;
    Asset?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
  };
};

type ContentfulFetchOptions = {
  preview?: boolean;
};

const DEFAULT_CONTENTFUL_REVALIDATE_SECONDS = 60;

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
  if (contentType === "authorProfile") return [...base, "content:blog"];
  if (contentType === "classDefinition") return [...base, "content:classes", "content:schedule"];
  if (contentType === "smallGroupProgramme") return [...base, "content:classes"];
  if (contentType === "instructorProfile") return [...base, "content:classes", "content:schedule"];
  if (
    contentType === "retreatTemplate" ||
    contentType === "retreatVenue" ||
    contentType === "retreatEvent"
  ) {
    return [...base, "content:retreats"];
  }
  if (contentType === "newsletterSignupContent") return [...base, "content:newsletter-signup"];
  if (contentType === "leadMagnet") return [...base, "content:newsletter-signup", "content:emails"];
  if (contentType === "faqItem") return [...base, "content:global-blocks"];
  if (contentType === "newsletterTemplate") return [...base, "content:emails"];
  if (contentType === "testimonial") return [...base, "content:testimonials"];

  return base;
}

function getContentfulRevalidateSeconds() {
  const value = Number(
    process.env.CONTENTFUL_REVALIDATE_SECONDS || DEFAULT_CONTENTFUL_REVALIDATE_SECONDS
  );
  if (!Number.isFinite(value) || value < 1) {
    return DEFAULT_CONTENTFUL_REVALIDATE_SECONDS;
  }
  return Math.floor(value);
}

function getContentfulRequestTimeoutMs() {
  return Math.max(1000, Number(process.env.CONTENTFUL_REQUEST_TIMEOUT_MS || "4000"));
}

async function cdaFetch<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
  options: ContentfulFetchOptions = {}
) {
  const cfg = getContentfulConfig();
  if (!cfg) {
    throw new Error(
      "CONTENTFUL_CONFIG_MISSING: CONTENTFUL_SPACE_ID and CONTENTFUL_DELIVERY_TOKEN are required"
    );
  }

  const token = options.preview ? cfg.previewToken : cfg.deliveryToken;
  if (!token) {
    throw new Error(
      options.preview ? "CONTENTFUL_PREVIEW_TOKEN_MISSING" : "CONTENTFUL_DELIVERY_TOKEN_MISSING"
    );
  }

  const qs = toQueryString(query);
  const host = options.preview ? "preview.contentful.com" : "cdn.contentful.com";
  const url = `https://${host}/spaces/${cfg.spaceId}/environments/${cfg.environment}${path}${qs ? `?${qs}` : ""}`;

  let res: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getContentfulRequestTimeoutMs());
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      ...(options.preview
        ? { cache: "no-store" as const }
        : {
            next: {
              revalidate: getContentfulRevalidateSeconds(),
              tags: getCacheTags(
                typeof query.content_type === "string" ? query.content_type : undefined
              ),
            },
          }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown request failure";
    throw new Error(`CONTENTFUL_REQUEST_FAILED: ${message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`CONTENTFUL_REQUEST_FAILED: ${res.status} ${res.statusText}`.trim());
  }

  return (await res.json()) as T;
}

export async function getEntries<TFields>(
  contentType: string,
  query: Record<string, string | number | boolean | undefined> = {},
  options: ContentfulFetchOptions = {}
): Promise<EntriesResponse<TFields> | null> {
  return cdaFetch<EntriesResponse<TFields>>(
    "/entries",
    {
      content_type: contentType,
      ...query,
    },
    options
  );
}

export async function getEntryBySlug<TFields>(
  contentType: string,
  slug: string,
  slugField = "slug",
  options: ContentfulFetchOptions = {}
): Promise<EntryEnvelope<TFields> | null> {
  const res = await getEntries<TFields>(
    contentType,
    {
      [`fields.${slugField}`]: slug,
      limit: 1,
    },
    options
  );

  return res?.items?.[0] ?? null;
}

export async function getEntryById<TFields>(
  contentType: string,
  entryId: string,
  options: ContentfulFetchOptions = {}
): Promise<EntryEnvelope<TFields> | null> {
  const res = await getEntries<TFields>(
    contentType,
    {
      "sys.id": entryId,
      limit: 1,
    },
    options
  );

  return res?.items?.[0] ?? null;
}
