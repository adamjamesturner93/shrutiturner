import { DashboardShellSkeleton, HealthProfilePageSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function DashboardHealthLoading() {
  return (
    <LoadingRegion label="Loading your health profile">
      <DashboardShellSkeleton>
        <HealthProfilePageSkeleton />
      </DashboardShellSkeleton>
    </LoadingRegion>
  );
}
