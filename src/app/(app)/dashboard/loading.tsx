"use client";

import { DashboardShellSkeleton, DashboardSkeleton } from "@/components/dashboard-skeleton";

export default function DashboardLoading() {
  return (
    <DashboardShellSkeleton>
      <DashboardSkeleton />
    </DashboardShellSkeleton>
  );
}
