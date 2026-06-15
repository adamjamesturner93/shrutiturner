import "server-only";

import { db } from "@/lib/db";

const RUNTIME_RUN_RETENTION_DAYS = 30;
const LEASE_STALE_AFTER_HOURS = 24;

function subtractDays(date: Date, days: number) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

function subtractHours(date: Date, hours: number) {
  return new Date(date.getTime() - hours * 60 * 60 * 1000);
}

export async function cleanupScheduledJobRuntimeData(now = new Date()) {
  const runsBefore = subtractDays(now, RUNTIME_RUN_RETENTION_DAYS);
  const leasesBefore = subtractHours(now, LEASE_STALE_AFTER_HOURS);

  const [deletedRuns, deletedLeases] = await db.$transaction([
    db.scheduledJobRun.deleteMany({
      where: {
        createdAt: { lt: runsBefore },
        finishedAt: { not: null },
      },
    }),
    db.scheduledJobLease.deleteMany({
      where: {
        leasedUntil: { lt: leasesBefore },
      },
    }),
  ]);

  return {
    deletedRuns: deletedRuns.count,
    deletedLeases: deletedLeases.count,
    retainedRunDays: RUNTIME_RUN_RETENTION_DAYS,
    staleLeaseHours: LEASE_STALE_AFTER_HOURS,
    cleanedAt: now.toISOString(),
  };
}
