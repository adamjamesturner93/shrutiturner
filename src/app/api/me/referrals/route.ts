import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getReferralSummary } from "@/lib/referrals/referral-service";

function siteUrlFromRequest(request: Request) {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const summary = await getReferralSummary(user.id, siteUrlFromRequest(request));
    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/me/referrals failed", error);
    return NextResponse.json({ message: "Failed to load referrals" }, { status: 500 });
  }
}
