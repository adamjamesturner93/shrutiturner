import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { isOwnerAdminRole } from "@/lib/authz/roles";
import { listAdminCoachingApplications } from "@/lib/coaching/service";
import { AdminCoaching } from "@/views/admin/coaching";
import AdminLoading from "../loading";

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminCoachingContent />
    </Suspense>
  );
}

async function AdminCoachingContent() {
  const session = await auth();
  const initialData = isOwnerAdminRole(session?.user?.role)
    ? await listAdminCoachingApplications({ status: "all", tier: "all" })
    : null;
  return <AdminCoaching initialData={initialData} />;
}
