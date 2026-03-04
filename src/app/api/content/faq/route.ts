import { NextResponse } from "next/server";
import { getFaqItems, getFaqItemsFor } from "@/lib/content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const section = searchParams.get("section");
  const items = page ? await getFaqItemsFor(page, section || undefined) : await getFaqItems();
  return NextResponse.json(items);
}
