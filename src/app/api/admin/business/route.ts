import { connection } from "next/server";
import { getAdminBusinessSummary } from "@/lib/admin/business-service";
import { apiOk, handleApiRoute } from "@/lib/api/route";

export const GET = handleApiRoute(
  async () => {
    await connection();
    const summary = await getAdminBusinessSummary();
    return apiOk(summary);
  },
  { auth: "staff_admin" }
);
