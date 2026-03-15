import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { triggerContentfulPublishCampaign } from "@/lib/newsletter/campaign-automation";

const WEBHOOK_SECRET = process.env.CONTENTFUL_WEBHOOK_SECRET;

function topicToTags(topic: string) {
  if (topic.includes("classDefinition")) return ["content:classes", "content:schedule"];
  if (topic.includes("smallGroupProgramme")) return ["content:classes"];
  if (topic.includes("instructorProfile")) return ["content:classes", "content:schedule"];
  if (
    topic.includes("retreatTemplate") ||
    topic.includes("retreatVenue") ||
    topic.includes("retreatInstance")
  )
    return ["content:retreats"];
  if (topic.includes("blogPost")) return ["content:blog"];
  if (topic.includes("legalDocument")) return ["content:legal"];
  if (topic.includes("newsletterSignupContent")) return ["content:newsletter-signup"];
  if (topic.includes("leadMagnet")) return ["content:newsletter-signup", "content:emails"];
  if (topic.includes("faqItem") || topic.includes("trustBadge") || topic.includes("contactBlock")) {
    return ["content:global-blocks"];
  }
  if (topic.includes("announcementBanner")) return ["content:announcements"];
  if (topic.includes("transactionalEmailTemplate") || topic.includes("newsletterTemplate")) {
    return ["content:emails"];
  }
  if (topic.includes("globalContent")) return ["content:global"];
  return ["content:all"];
}

export async function POST(req: NextRequest) {
  const provided = req.headers.get("x-contentful-webhook-secret");
  if (WEBHOOK_SECRET && provided !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const topic = req.headers.get("x-contentful-topic") || "";
  const contentType =
    req.headers.get("x-contentful-content-type") ||
    req.headers.get("x-contentful-resource-type") ||
    "";
  const body = (await req.json().catch(() => null)) as {
    sys?: { id?: string; version?: number; contentType?: { sys?: { id?: string } } };
  } | null;
  const entryId = req.headers.get("x-contentful-id") || body?.sys?.id || "";
  const resolvedContentType =
    (body?.sys?.contentType?.sys?.id ? String(body.sys.contentType.sys.id) : "") || contentType;

  const tags = topicToTags(topic);
  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  let campaign: { skipped: boolean; reason?: string; campaignId?: string } | undefined;
  if (topic.toLowerCase().includes("publish") && resolvedContentType && entryId) {
    campaign = await triggerContentfulPublishCampaign({
      contentType: resolvedContentType,
      contentfulEntryId: entryId,
      contentfulVersion: body?.sys?.version ? String(body.sys.version) : undefined,
    });
  }

  return NextResponse.json({ ok: true, tags, campaign });
}
