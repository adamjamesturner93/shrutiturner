import { NextResponse } from "next/server";
import { getTransactionalEmailTemplates } from "@/lib/content";

export async function GET() {
  const items = await getTransactionalEmailTemplates();
  return NextResponse.json(items);
}
