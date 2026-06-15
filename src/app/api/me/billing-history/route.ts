import { connection } from "next/server";
import { apiOk, handleApiRoute } from "@/lib/api/route";
import { getBillingHistory } from "@/lib/billing/history-service";

export const GET = handleApiRoute(
  async ({ request, sessionUser }) => {
    await connection();
    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(10, Number(url.searchParams.get("limit") || 50)));
    const rows = await getBillingHistory(sessionUser!.id, limit);
    return apiOk(rows);
  },
  { auth: "user" }
);
