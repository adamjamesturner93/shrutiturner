import { AppShellPageSkeleton, DashboardShellSkeleton } from "@/components/dashboard-skeleton";

export default function AppLoading() {
  return (
    <DashboardShellSkeleton>
      <AppShellPageSkeleton />
    </DashboardShellSkeleton>
  );
}
