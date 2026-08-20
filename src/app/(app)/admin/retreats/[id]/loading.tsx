import { AdminShellSkeleton, DetailSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function AdminRetreatDetailLoading() {
  return (
    <LoadingRegion label="Loading retreat administration">
      <AdminShellSkeleton>
        <DetailSkeleton />
      </AdminShellSkeleton>
    </LoadingRegion>
  );
}
