import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const WEBHOOK_SECRET = process.env.CONTENTFUL_WEBHOOK_SECRET;

function topicToTags(topic: string) {
  if (topic.includes("classDefinition")) return ["content:classes", "content:schedule"];
  if (topic.includes("retreatTemplate") || topic.includes("retreatVenue")) return ["content:retreats"];
  if (topic.includes("blogPost")) return ["content:blog"];
  if (topic.includes("pageContent")) return ["content:pages"];
  if (topic.includes("globalContent")) return ["content:global"];
  return ["content:all"];
}

export async function POST(req: NextRequest) {
  const provided = req.headers.get("x-contentful-webhook-secret");
  if (WEBHOOK_SECRET && provided !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const topic = req.headers.get("x-contentful-topic") || "";
  const tags = topicToTags(topic);
  for (const tag of tags) {
    revalidateTag(tag);
  }

  return NextResponse.json({ ok: true, tags });
}
