import { NextResponse } from "next/server";
import { getBlogPosts } from "@/lib/content";

export async function GET() {
  const posts = await getBlogPosts();
  return NextResponse.json({ items: posts });
}
