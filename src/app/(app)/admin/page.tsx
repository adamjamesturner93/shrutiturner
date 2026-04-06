import { AdminDashboard } from "@/views/admin/dashboard";
import { auth } from "@/lib/auth";
import { isOwnerAdminRole } from "@/lib/authz/roles";
import { getAdminDashboardSummary } from "@/lib/admin/dashboard-service";

export default async function Page() {
  const session = await auth();
  const initialData = isOwnerAdminRole(session?.user?.role)
    ? await getAdminDashboardSummary()
    : null;
  return <AdminDashboard initialData={initialData} />;
}
