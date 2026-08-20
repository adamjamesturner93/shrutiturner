import { DashboardShellSkeleton, RetreatsListPageSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function DashboardRetreatsLoading() {
  return (
    <LoadingRegion label="Loading your retreats">
      <DashboardShellSkeleton>
        <RetreatsListPageSkeleton />
      </DashboardShellSkeleton>
    </LoadingRegion>
  );
}
