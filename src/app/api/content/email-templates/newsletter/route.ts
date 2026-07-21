import { connection, NextResponse } from "next/server";
import { getNewsletterTemplates } from "@/lib/content";

export async function GET() {
  await connection();
  const items = await getNewsletterTemplates();
  return NextResponse.json(items);
}
