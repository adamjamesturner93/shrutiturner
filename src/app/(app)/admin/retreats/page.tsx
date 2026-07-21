import { connection } from "next/server";
import { AdminRetreats } from "@/views/admin/retreats";
import { getAdminRetreatSummaries } from "@/lib/retreats/service";

export default async function Page() {
  await connection();
  const initialData = await getAdminRetreatSummaries();
  return <AdminRetreats initialData={initialData} />;
}
