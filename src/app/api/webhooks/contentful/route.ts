import { after, NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getBlogPostSlugByContentfulEntryId } from "@/lib/content";
import { triggerContentfulPublishCampaign } from "@/lib/newsletter/campaign-automation";

type ContentfulWebhookBody = {
  fields?: {
    slug?: unknown;
  };
  sys?: {
    id?: string;
    version?: number;
    contentType?: { sys?: { id?: string } };
  };
};

function getWebhookSecret() {
  return process.env.CONTENTFUL_WEBHOOK_SECRET?.trim() || "";
}

function isWebhookSecretRequired() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL === "1"
  );
}

function contentTypeToTags(contentType: string) {
  if (contentType === "classDefinition") return ["content:classes", "content:schedule"];
  if (contentType === "smallGroupProgramme") return ["content:classes"];
  if (contentType === "instructorProfile") return ["content:classes", "content:schedule"];
  if (
    contentType === "retreatTemplate" ||
    contentType === "retreatVenue" ||
    contentType === "retreatEvent"
  ) {
    return ["content:retreats"];
  }
  if (contentType === "blogPost") return ["content:blog"];
  if (contentType === "authorProfile") return ["content:blog"];
  if (contentType === "newsletterSignupContent") return ["content:newsletter-signup"];
  if (contentType === "leadMagnet") return ["content:newsletter-signup", "content:emails"];
  if (contentType === "faqItem") return ["content:global-blocks"];
  if (contentType === "newsletterTemplate") return ["content:emails"];
  if (contentType === "testimonial") return ["content:testimonials"];
  return ["content:all"];
}

function topicToTags(topic: string) {
  const contentTypes = [
    "classDefinition",
    "smallGroupProgramme",
    "instructorProfile",
    "retreatTemplate",
    "retreatVenue",
    "retreatEvent",
    "blogPost",
    "authorProfile",
    "newsletterSignupContent",
    "leadMagnet",
    "faqItem",
    "newsletterTemplate",
    "testimonial",
  ];
  const matched = contentTypes.find((contentType) => topic.includes(contentType));
  return matched ? contentTypeToTags(matched) : ["content:all"];
}

function getRevalidationTags(contentType: string, topic: string) {
  return contentType ? contentTypeToTags(contentType) : topicToTags(topic);
}

function readSlugField(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const localized = Object.values(value).find((item) => typeof item === "string" && item.trim());
    return typeof localized === "string" ? localized.trim() : null;
  }
  return null;
}

function shouldRevalidateEntryPath(topic: string) {
  const lowered = topic.toLowerCase();
  return (
    lowered.includes("publish") ||
    lowered.includes("unpublish") ||
    lowered.includes("delete") ||
    lowered.includes("archive")
  );
}

function runAfterResponse(task: () => Promise<void>) {
  try {
    after(task);
  } catch {
    void task();
  }
}

async function processPublishCampaign(input: {
  contentType: string;
  contentfulEntryId: string;
  contentfulVersion?: string;
}) {
  try {
    await triggerContentfulPublishCampaign(input);
  } catch (error) {
    console.error("Contentful publish campaign processing failed", {
      contentType: input.contentType,
      contentfulEntryId: input.contentfulEntryId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function revalidateBlogPaths(input: {
  topic: string;
  contentType: string;
  body: ContentfulWebhookBody | null;
  entryId: string;
}) {
  if (input.contentType !== "blogPost" || !shouldRevalidateEntryPath(input.topic)) {
    return [];
  }

  const paths = ["/blog"];
  const bodySlug = readSlugField(input.body?.fields?.slug);
  const slug =
    bodySlug || (input.entryId ? await getBlogPostSlugByContentfulEntryId(input.entryId) : null);

  if (slug) {
    paths.push(`/blog/${slug}`);
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return paths;
}

export async function POST(req: NextRequest) {
  const webhookSecret = getWebhookSecret();
  const provided = req.headers.get("x-contentful-webhook-secret");
  if (!webhookSecret && isWebhookSecretRequired()) {
    return NextResponse.json({ error: "webhook_secret_not_configured" }, { status: 503 });
  }
  if (webhookSecret && provided !== webhookSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const topic = req.headers.get("x-contentful-topic") || "";
  const contentType =
    req.headers.get("x-contentful-content-type") ||
    req.headers.get("x-contentful-resource-type") ||
    "";
  const body = (await req.json().catch(() => null)) as ContentfulWebhookBody | null;
  const entryId = req.headers.get("x-contentful-id") || body?.sys?.id || "";
  const resolvedContentType =
    (body?.sys?.contentType?.sys?.id ? String(body.sys.contentType.sys.id) : "") || contentType;

  const tags = getRevalidationTags(resolvedContentType, topic);
  for (const tag of tags) {
    revalidateTag(tag, "max");
  }
  if (shouldRevalidateEntryPath(topic)) {
    revalidatePath("/sitemap.xml");
  }

  const paths = await revalidateBlogPaths({
    topic,
    contentType: resolvedContentType,
    body,
    entryId,
  });

  let campaign: { queued: boolean; contentType: string; contentfulEntryId: string } | undefined;
  if (topic.toLowerCase().includes("publish") && resolvedContentType && entryId) {
    const campaignInput = {
      contentType: resolvedContentType,
      contentfulEntryId: entryId,
      contentfulVersion: body?.sys?.version ? String(body.sys.version) : undefined,
    };
    runAfterResponse(async () => {
      await processPublishCampaign(campaignInput);
    });
    campaign = {
      queued: true,
      contentType: resolvedContentType,
      contentfulEntryId: entryId,
    };
  }

  return NextResponse.json({ ok: true, tags, paths, campaign });
}
