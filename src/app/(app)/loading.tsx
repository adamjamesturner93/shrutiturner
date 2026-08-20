import { AppShellPageSkeleton, DashboardShellSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function AppLoading() {
  return (
    <LoadingRegion label="Loading your private studio">
      <DashboardShellSkeleton>
        <AppShellPageSkeleton />
      </DashboardShellSkeleton>
    </LoadingRegion>
  );
}
