import { AdminShellSkeleton, AdminTablePageSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";

export default function AdminLoading() {
  return (
    <LoadingRegion label="Loading instructor admin">
      <AdminShellSkeleton>
        <AdminTablePageSkeleton />
      </AdminShellSkeleton>
    </LoadingRegion>
  );
}
