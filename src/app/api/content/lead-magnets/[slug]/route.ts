import { NextRequest, NextResponse } from "next/server";
import { getLeadMagnetBySlug } from "@/lib/content";

export async function GET(_: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const item = await getLeadMagnetBySlug(slug);
  if (!item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(item);
}
