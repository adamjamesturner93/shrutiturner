"use client";
import { useEffect, useState } from "react";
import { LoadingRegion } from "@/components/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardShellSkeleton, AdminShellSkeleton } from "@/components/dashboard-skeleton";

export function ProgrammeContentLoading({
  label = "Loading programme content",
  header = false,
  kind = "week",
}: {
  label?: string;
  header?: boolean;
  kind?: string;
}) {
  return (
    <LoadingRegion label={label} className="w-full space-y-6 motion-reduce:[&_*]:animate-none">
      {header && (
        <div className="bg-brand-dark space-y-5 rounded-[1.75rem] p-8">
          <Skeleton className="h-4 w-40 bg-white/15" />
          <Skeleton className="h-10 w-4/5 bg-white/15" />
          <Skeleton className="h-5 w-48 bg-white/15" />
        </div>
      )}
      {header && (
        <div className="bg-secondary flex gap-3 rounded-2xl p-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
      )}
      <div
        className={`${kind === "weeks" ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : "space-y-5"}`}
      >
        <div className="border-brand-dark/10 bg-background space-y-5 rounded-2xl border p-6">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        {["live", "community", "resources", "weeks"].includes(kind) && (
          <div className="border-brand-dark/10 space-y-4 rounded-2xl border p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
      </div>
    </LoadingRegion>
  );
}
export function ProgrammePageLoading({
  label = "Loading your programmes",
  admin = false,
}: {
  label?: string;
  admin?: boolean;
}) {
  const Shell = admin ? AdminShellSkeleton : DashboardShellSkeleton;
  return (
    <Shell>
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <ProgrammeContentLoading label={label} header />
      </div>
    </Shell>
  );
}

export function DelayedProgrammeLoading({
  label,
  kind = "week",
}: {
  label: string;
  kind?: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-80" data-content-pending>
      {visible && <ProgrammeContentLoading label={label} kind={kind} />}
    </div>
  );
}
