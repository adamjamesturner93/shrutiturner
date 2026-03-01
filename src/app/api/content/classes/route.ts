import { NextResponse } from "next/server";
import { getClassDefinitions } from "@/lib/content";

export async function GET() {
  const items = await getClassDefinitions();
  return NextResponse.json({ items });
}
