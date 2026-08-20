import { DashboardShellSkeleton, RedirectPageSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function RetreatHostLoading() {
  return (
    <LoadingRegion label="Preparing the retreat host room">
      <DashboardShellSkeleton>
        <RedirectPageSkeleton label="Preparing the retreat host room…" />
      </DashboardShellSkeleton>
    </LoadingRegion>
  );
}
