import { auth } from "@/lib/auth";
import { isOwnerAdminRole } from "@/lib/authz/roles";
import { getAdminRetreatSummaries } from "@/lib/retreats/service";
import { AdminRetreats } from "@/views/admin/retreats";

export default async function Page() {
  const session = await auth();
  const initialData = isOwnerAdminRole(session?.user?.role)
    ? await getAdminRetreatSummaries()
    : null;
  return <AdminRetreats initialData={initialData} />;
}
