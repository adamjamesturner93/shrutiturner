import { DashboardShellSkeleton, RedirectPageSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function RetreatLiveLoading() {
  return (
    <LoadingRegion label="Preparing your live retreat">
      <DashboardShellSkeleton>
        <RedirectPageSkeleton label="Preparing your live retreat…" />
      </DashboardShellSkeleton>
    </LoadingRegion>
  );
}
