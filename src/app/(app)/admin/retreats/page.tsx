import { connection } from "next/server";
import { Suspense } from "react";
import { AdminRetreats } from "@/views/admin/retreats";
import { getAdminRetreatSummaries } from "@/lib/retreats/service";
import AdminLoading from "../loading";

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminRetreatsContent />
    </Suspense>
  );
}

async function AdminRetreatsContent() {
  await connection();
  const initialData = await getAdminRetreatSummaries();
  return <AdminRetreats initialData={initialData} />;
}
