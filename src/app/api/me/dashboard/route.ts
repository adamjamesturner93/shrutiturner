import { connection } from "next/server";
import { apiOk, handleApiRoute } from "@/lib/api/route";
import { getDashboardSummary } from "@/lib/dashboard/dashboard-service";

export const GET = handleApiRoute(
  async ({ sessionUser }) => {
    await connection();
    const summary = await getDashboardSummary(sessionUser!.id);
    return apiOk(summary);
  },
  { auth: "user" }
);
