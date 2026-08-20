import { CoachingPageSkeleton, DashboardShellSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function DashboardCoachingLoading() {
  return (
    <LoadingRegion label="Loading coaching">
      <DashboardShellSkeleton>
        <CoachingPageSkeleton />
      </DashboardShellSkeleton>
    </LoadingRegion>
  );
}
