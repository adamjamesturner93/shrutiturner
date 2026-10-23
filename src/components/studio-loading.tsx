import { DashboardShellSkeleton } from "@/components/dashboard-skeleton";
import { LoadingRegion } from "@/components/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

export function StudioLoadingContent() {
  return (
    <LoadingRegion
      label="Loading your studio dashboard"
      className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-8 md:py-12"
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-[36rem] max-w-full" />
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="space-y-5 rounded-[1.75rem] border p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-11 w-40" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function StudioLoading() {
  return (
    <DashboardShellSkeleton contentClassName="mx-auto max-w-7xl p-4 md:p-6">
      <StudioLoadingContent />
    </DashboardShellSkeleton>
  );
}
