import { connection } from "next/server";
import { AdminDashboard } from "@/views/admin/dashboard";
import { getAdminDashboardSummary } from "@/lib/admin/dashboard-service";

export default async function Page() {
  await connection();
  const initialData = await getAdminDashboardSummary();
  return <AdminDashboard initialData={initialData} />;
}
