import { auth } from "@/lib/auth";
import { listAdminCoachingApplications } from "@/lib/coaching/service";
import { AdminCoaching } from "@/views/admin/coaching";

export default async function Page() {
  const session = await auth();
  const initialData =
    session?.user?.role === "admin"
      ? await listAdminCoachingApplications({ status: "all", tier: "all" })
      : null;
  return <AdminCoaching initialData={initialData} />;
}
