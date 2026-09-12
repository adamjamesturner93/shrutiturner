import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isOwnerAdminRole } from "@/lib/authz/roles";
import { listAdminCoachingApplications } from "@/lib/coaching/service";
import { AdminCoachingDetail } from "@/views/admin/coaching-detail";
import AdminLoading from "../../loading";

export default function Page({ params }: { params: Promise<{ applicationId: string }> }) {
  return <Suspense fallback={<AdminLoading />}><Content params={params} /></Suspense>;
}

async function Content({ params }: { params: Promise<{ applicationId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isOwnerAdminRole(session.user.role)) redirect("/dashboard");
  const { applicationId } = await params;
  const application = (await listAdminCoachingApplications({ status: "all", tier: "all" })).find((row) => row.id === applicationId);
  if (!application) notFound();
  return <AdminCoachingDetail application={application} />;
}
