import { DashboardShellSkeleton, DashboardSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function DashboardLoading() {
  return (
    <LoadingRegion label="Loading your studio dashboard">
      <DashboardShellSkeleton>
        <DashboardSkeleton />
      </DashboardShellSkeleton>
    </LoadingRegion>
  );
}
