import { NextResponse } from "next/server";
import { getRetreatsCombined } from "@/lib/content";

export async function GET() {
  const items = await getRetreatsCombined();
  return NextResponse.json({ items });
}
