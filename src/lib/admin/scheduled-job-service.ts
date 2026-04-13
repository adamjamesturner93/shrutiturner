import { randomUUID } from "node:crypto";
import { ScheduledJobRunStatus, ScheduledJobTriggerType, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const DEFAULT_LEASE_MS = 15 * 60 * 1000;

async function acquireScheduledJobLease(jobName: string, actorUserId?: string | null) {
  const leaseId = randomUUID();
  const now = new Date();
  const leasedUntil = new Date(now.getTime() + DEFAULT_LEASE_MS);

  try {
    await db.scheduledJobLease.create({
      data: {
        jobName,
        leaseId,
        actorUserId: actorUserId || null,
        leasedUntil,
      },
    });
    return { leaseId, leasedUntil };
  } catch {
    const refreshed = await db.scheduledJobLease.updateMany({
      where: {
        jobName,
        leasedUntil: {
          lt: now,
        },
      },
      data: {
        leaseId,
        actorUserId: actorUserId || null,
        leasedUntil,
      },
    });

    if (refreshed.count > 0) {
      return { leaseId, leasedUntil };
    }

    return null;
  }
}

async function releaseScheduledJobLease(jobName: string, leaseId: string) {
  await db.scheduledJobLease.deleteMany({
    where: {
      jobName,
      leaseId,
    },
  });
}

export async function runScheduledJob<T extends Prisma.JsonValue | Record<string, unknown>>(input: {
  jobName: string;
  triggerType: ScheduledJobTriggerType;
  actorUserId?: string | null;
  run: () => Promise<T>;
}) {
  const lease = await acquireScheduledJobLease(input.jobName, input.actorUserId);

  if (!lease) {
    const skipped = await db.scheduledJobRun.create({
      data: {
        jobName: input.jobName,
        triggerType: input.triggerType,
        actorUserId: input.actorUserId || null,
        status: ScheduledJobRunStatus.skipped,
        errorSummary: "Skipped because another run still holds the active lease.",
        finishedAt: new Date(),
      },
    });

    return {
      run: skipped,
      result: {
        skipped: true,
        reason: "active_lease",
      } as unknown as T,
    };
  }

  const started = await db.scheduledJobRun.create({
    data: {
      jobName: input.jobName,
      triggerType: input.triggerType,
      actorUserId: input.actorUserId || null,
      status: ScheduledJobRunStatus.started,
    },
  });

  try {
    const result = await input.run();
    const countersJson = result as Prisma.InputJsonValue;
    const finished = await db.scheduledJobRun.update({
      where: { id: started.id },
      data: {
        status: ScheduledJobRunStatus.succeeded,
        countersJson,
        finishedAt: new Date(),
      },
    });
    await releaseScheduledJobLease(input.jobName, lease.leaseId);
    return { run: finished, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scheduled job failure";
    const failed = await db.scheduledJobRun.update({
      where: { id: started.id },
      data: {
        status: ScheduledJobRunStatus.failed,
        errorSummary: message,
        finishedAt: new Date(),
      },
    });
    await releaseScheduledJobLease(input.jobName, lease.leaseId);
    throw Object.assign(new Error(message), { scheduledJobRun: failed });
  }
}

export async function listScheduledJobRuns(limit = 50) {
  return db.scheduledJobRun.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    include: {
      actor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}
