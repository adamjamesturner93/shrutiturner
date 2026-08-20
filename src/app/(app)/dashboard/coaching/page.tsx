import { Suspense } from "react";
import { auth } from "@/lib/auth";
import type { CoachingDashboardDto } from "@/lib/api/types";
import { getMyCoachingState } from "@/lib/coaching/service";
import { DashboardCoaching } from "@/views/dashboard/coaching";
import DashboardCoachingLoading from "./loading";

export default function Page() {
  return (
    <Suspense fallback={<DashboardCoachingLoading />}>
      <DashboardCoachingContent />
    </Suspense>
  );
}

async function DashboardCoachingContent() {
  const session = await auth();
  const initialData: CoachingDashboardDto | null = session?.user?.id
    ? await getMyCoachingState(session.user.id)
    : null;
  return <DashboardCoaching initialData={initialData} />;
}
