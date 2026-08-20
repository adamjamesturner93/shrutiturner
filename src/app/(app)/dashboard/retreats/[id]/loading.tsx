import {
  DashboardShellSkeleton,
  RetreatBookingPageSkeleton,
} from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function DashboardRetreatDetailLoading() {
  return (
    <LoadingRegion label="Loading your retreat booking">
      <DashboardShellSkeleton>
        <RetreatBookingPageSkeleton />
      </DashboardShellSkeleton>
    </LoadingRegion>
  );
}
