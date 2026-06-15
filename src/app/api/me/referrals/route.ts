import { connection } from "next/server";
import { apiOk, handleApiRoute } from "@/lib/api/route";
import { getBaseSiteUrlFromEnv } from "@/lib/env";
import { getReferralSummary } from "@/lib/referrals/referral-service";

function siteUrlFromRequest(request: Request) {
  const configured = getBaseSiteUrlFromEnv();
  if (configured !== "http://localhost:3000") return configured;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export const GET = handleApiRoute(
  async ({ request, sessionUser }) => {
    await connection();
    const summary = await getReferralSummary(sessionUser!.id, siteUrlFromRequest(request));
    return apiOk(summary);
  },
  { auth: "user" }
);
