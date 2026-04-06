import { ScheduledJobRunStatus, ScheduledJobTriggerType, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function runScheduledJob<T extends Prisma.JsonValue | Record<string, unknown>>(input: {
  jobName: string;
  triggerType: ScheduledJobTriggerType;
  actorUserId?: string | null;
  run: () => Promise<T>;
}) {
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
