import { DashboardShellSkeleton, DetailSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function DashboardClassJoinLoading() {
  return (
    <LoadingRegion label="Loading class session">
      <DashboardShellSkeleton>
        <DetailSkeleton />
      </DashboardShellSkeleton>
    </LoadingRegion>
  );
}
