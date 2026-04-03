import { DashboardShellSkeleton, SchedulePageSkeleton } from "@/components/dashboard-skeleton";

export default function DashboardScheduleLoading() {
  return (
    <DashboardShellSkeleton>
      <SchedulePageSkeleton />
    </DashboardShellSkeleton>
  );
}
