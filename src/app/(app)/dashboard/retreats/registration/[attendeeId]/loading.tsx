import { DashboardShellSkeleton, HealthProfilePageSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function RegistrationLoading() {
  return (
    <LoadingRegion label="Loading your attendee setup">
      <DashboardShellSkeleton>
        <HealthProfilePageSkeleton />
      </DashboardShellSkeleton>
    </LoadingRegion>
  );
}
