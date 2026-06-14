import { connection } from "next/server";
import { getAdminBusinessSummary } from "@/lib/admin/business-service";
import { apiOk, handleApiRoute } from "@/lib/api/route";

const getBusinessSummary = handleApiRoute(
  async () => {
    const summary = await getAdminBusinessSummary();
    return apiOk(summary);
  },
  { auth: "staff_admin" }
);

export async function GET(request: Request) {
  await connection();
  return getBusinessSummary(request);
}
