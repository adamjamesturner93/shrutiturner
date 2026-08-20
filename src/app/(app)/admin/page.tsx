import { connection } from "next/server";
import { Suspense } from "react";
import { AdminDashboard } from "@/views/admin/dashboard";
import { getAdminDashboardSummary } from "@/lib/admin/dashboard-service";
import AdminLoading from "./loading";

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

async function AdminDashboardContent() {
  await connection();
  const initialData = await getAdminDashboardSummary();
  return <AdminDashboard initialData={initialData} />;
}
