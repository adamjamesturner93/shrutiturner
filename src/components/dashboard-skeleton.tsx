import type { ReactNode } from "react";
import { Skeleton } from "./ui/skeleton";

/**
 * Reusable skeleton layout for dashboard pages while data loads.
 * Provides a clean placeholder that matches the typical dashboard card layout.
 */
export function DashboardSkeleton() {
  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      {/* Header skeleton */}
      <div className="app-page-header space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="app-metric-card space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Content cards skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="bg-secondary/20 flex items-center gap-3 rounded-md p-3">
                  <Skeleton className="h-10 w-10 flex-shrink-0 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardShellSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-surface flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-brand-white/10 bg-[linear-gradient(180deg,rgba(46,31,51,0.98),rgba(86,52,74,0.98))] p-6 lg:flex">
        <div className="space-y-3">
          <Skeleton className="h-7 w-40 bg-white/15" />
          <Skeleton className="h-3 w-24 bg-white/10" />
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 p-4">
          <Skeleton className="h-10 w-10 rounded-full bg-white/15" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24 bg-white/15" />
            <Skeleton className="h-3 w-20 bg-white/10" />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <Skeleton className="h-4 w-4 rounded-sm bg-white/12" />
              <Skeleton className="h-4 w-28 bg-white/12" />
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <Skeleton className="h-3 w-24 bg-white/10" />
          <Skeleton className="h-3 w-20 bg-white/10" />
          <Skeleton className="h-4 w-16 bg-white/12" />
        </div>
      </aside>

      <div className="fixed inset-x-0 top-0 z-40 border-b border-brand-white/10 bg-[linear-gradient(180deg,rgba(46,31,51,0.98),rgba(86,52,74,0.98))] px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-5 bg-white/15" />
          <Skeleton className="h-4 w-28 bg-white/15" />
          <Skeleton className="h-8 w-8 rounded-full bg-white/15" />
        </div>
      </div>

      <main className="min-h-screen flex-1 pt-14 lg:ml-72 lg:pt-0">
        <div className="mx-auto max-w-7xl p-6 md:p-8 lg:p-10">{children}</div>
      </main>
    </div>
  );
}

export function AppShellPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="app-page-header space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-72 max-w-full" />
        <Skeleton className="h-4 w-[28rem] max-w-full" />
        <Skeleton className="h-4 w-40 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="app-metric-card space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 rounded-[1.5rem] border p-6">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-[1.5rem] border p-6">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SchedulePageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="app-page-header space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-64 max-w-full" />
        <Skeleton className="h-4 w-[30rem] max-w-full" />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-28 rounded-full" />
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, dayIndex) => (
          <div key={dayIndex} className="space-y-4">
            <Skeleton className="h-8 w-40" />
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <div key={cardIndex} className="rounded-[1.25rem] border p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex items-center gap-3 md:min-w-[160px]">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full max-w-lg" />
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 3 }).map((_, badgeIndex) => (
                        <Skeleton key={badgeIndex} className="h-6 w-20 rounded-full" />
                      ))}
                    </div>
                  </div>
                  <Skeleton className="h-10 w-32 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MembershipPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="app-page-header space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-12 w-80 max-w-full" />
        <Skeleton className="h-4 w-[24rem] max-w-full" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="app-metric-card space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="space-y-6 rounded-[1.5rem] border p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-8 w-36 rounded-full" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-4 rounded-[1.25rem] border p-5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
              {Array.from({ length: 3 }).map((_, lineIndex) => (
                <Skeleton key={lineIndex} className="h-4 w-full" />
              ))}
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HealthProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="app-page-header space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-12 w-64 max-w-full" />
        <Skeleton className="h-4 w-[30rem] max-w-full" />
      </div>

      <div className="max-w-5xl space-y-6">
        <Skeleton className="h-4 w-44" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-[1.25rem] border p-5">
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, badgeIndex) => (
                <Skeleton key={badgeIndex} className="h-7 w-28 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Single-column content skeleton for detail pages.
 */
export function DetailSkeleton() {
  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-full max-w-lg" />

      <div className="space-y-3 pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4">
        <Skeleton className="h-12 rounded-md" />
        <Skeleton className="h-12 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Table skeleton for list views.
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-in fade-in space-y-4 duration-300">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="overflow-hidden rounded-lg border">
        {/* Header */}
        <div className="bg-secondary/30 flex gap-6 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-t p-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-24" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
