import { NextResponse } from "next/server";
import { getPublicPricing } from "@/lib/billing/public-pricing";

export async function GET() {
  try {
    const pricing = await getPublicPricing();
    return NextResponse.json(pricing);
  } catch (error) {
    console.error("GET /api/public/pricing failed", error);
    return NextResponse.json({ message: "Failed to load pricing" }, { status: 500 });
  }
}
