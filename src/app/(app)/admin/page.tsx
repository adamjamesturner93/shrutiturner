import { AdminDashboard } from "@/views/admin/dashboard";
import { auth } from "@/lib/auth";
import { getAdminDashboardSummary } from "@/lib/admin/dashboard-service";

export default async function Page() {
  const session = await auth();
  const initialData = session?.user?.role === "admin" ? await getAdminDashboardSummary() : null;
  return <AdminDashboard initialData={initialData} />;
}
