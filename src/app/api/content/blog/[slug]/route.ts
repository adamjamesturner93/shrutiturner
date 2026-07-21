import { connection, NextRequest, NextResponse } from "next/server";
import { getBlogPostBySlug } from "@/lib/content";

export async function GET(_: NextRequest, context: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await context.params;
  const item = await getBlogPostBySlug(slug);
  if (!item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(item);
}
