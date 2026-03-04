import { NextResponse } from "next/server";
import { getNewsletterTemplates } from "@/lib/content";

export async function GET() {
  const items = await getNewsletterTemplates();
  return NextResponse.json(items);
}
