import { DashboardShellSkeleton, MembershipPageSkeleton } from "@/components/dashboard-skeleton";

export default function DashboardMembershipLoading() {
  return (
    <DashboardShellSkeleton>
      <MembershipPageSkeleton />
    </DashboardShellSkeleton>
  );
}
