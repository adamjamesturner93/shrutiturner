import { DashboardShellSkeleton, DetailSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function DashboardAccountLoading() {
  return (
    <LoadingRegion label="Loading your account">
      <DashboardShellSkeleton>
        <DetailSkeleton />
      </DashboardShellSkeleton>
    </LoadingRegion>
  );
}
