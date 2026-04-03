import { DashboardShellSkeleton, HealthProfilePageSkeleton } from "@/components/dashboard-skeleton";

export default function DashboardHealthLoading() {
  return (
    <DashboardShellSkeleton>
      <HealthProfilePageSkeleton />
    </DashboardShellSkeleton>
  );
}
