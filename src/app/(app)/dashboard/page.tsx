import { Suspense } from "react";
import { DashboardLobby } from "@/views/dashboard/lobby";
import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard/dashboard-service";
import DashboardLoading from "./loading";

export default function Page() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const session = await auth();
  const initialData = session?.user?.id ? await getDashboardSummary(session.user.id) : null;
  return <DashboardLobby initialData={initialData} />;
}
