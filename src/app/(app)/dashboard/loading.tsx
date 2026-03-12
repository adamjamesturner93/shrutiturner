"use client";

import { DashboardLayout } from "@/components/dashboard-layout";

export default function DashboardLoading() {
  return (
    <DashboardLayout title="Loading - Private Studio">
      <div className="space-y-4 p-1">
        <div className="bg-secondary h-8 w-56 animate-pulse rounded" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-secondary h-28 animate-pulse rounded" />
          ))}
        </div>
        <div className="bg-secondary h-56 animate-pulse rounded" />
      </div>
    </DashboardLayout>
  );
}
