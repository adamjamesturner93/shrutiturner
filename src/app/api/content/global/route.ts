import { NextResponse } from "next/server";
import { getGlobalContent } from "@/lib/content";

export async function GET() {
  const item = await getGlobalContent();
  return NextResponse.json(item);
}
