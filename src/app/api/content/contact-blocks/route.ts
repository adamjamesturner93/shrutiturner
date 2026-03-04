import { NextResponse } from "next/server";
import { getContactBlocks } from "@/lib/content";

export async function GET() {
  const items = await getContactBlocks();
  return NextResponse.json(items);
}
