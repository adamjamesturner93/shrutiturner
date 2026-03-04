import { NextResponse } from "next/server";
import { getTrustBadges } from "@/lib/content";

export async function GET() {
  const items = await getTrustBadges();
  return NextResponse.json(items);
}
