import { connection, NextResponse } from "next/server";
import { getClassDefinitions } from "@/lib/content";

export async function GET() {
  await connection();
  const items = await getClassDefinitions();
  return NextResponse.json({ items });
}
