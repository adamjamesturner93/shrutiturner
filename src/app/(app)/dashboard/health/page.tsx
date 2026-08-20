import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getHealthProfile } from "@/lib/health/health-service";
import { HealthProfilePage } from "@/views/dashboard/health-profile";
import DashboardHealthLoading from "./loading";

export default function Page() {
  return (
    <Suspense fallback={<DashboardHealthLoading />}>
      <DashboardHealthContent />
    </Suspense>
  );
}

async function DashboardHealthContent() {
  const session = await auth();
  const initialProfile = session?.user?.id ? await getHealthProfile(session.user.id) : undefined;

  return <HealthProfilePage initialProfile={initialProfile} />;
}
