import { DashboardShellSkeleton, RedirectPageSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function DashboardScheduleLoading() {
  return (
    <LoadingRegion label="Opening coaching">
      <DashboardShellSkeleton>
        <RedirectPageSkeleton label="Opening coaching…" />
      </DashboardShellSkeleton>
    </LoadingRegion>
  );
}
