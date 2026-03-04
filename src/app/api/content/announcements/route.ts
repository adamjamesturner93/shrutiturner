import { NextResponse } from "next/server";
import { getAnnouncementBanners } from "@/lib/content";

export async function GET() {
  const items = await getAnnouncementBanners();
  return NextResponse.json(items);
}
