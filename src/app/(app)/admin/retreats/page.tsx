import { auth } from "@/lib/auth";
import { getAdminRetreatSummaries } from "@/lib/retreats/service";
import { AdminRetreats } from "@/views/admin/retreats";

export default async function Page() {
  const session = await auth();
  const initialData = session?.user?.role === "admin" ? await getAdminRetreatSummaries() : null;
  return <AdminRetreats initialData={initialData} />;
}
