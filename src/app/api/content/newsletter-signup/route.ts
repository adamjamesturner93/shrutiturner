import { NextResponse } from "next/server";
import { getNewsletterSignupContent } from "@/lib/content";

export async function GET() {
  const item = await getNewsletterSignupContent();
  return NextResponse.json(item);
}
