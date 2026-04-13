import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ScheduledJobTriggerType } from "@prisma/client";
import { db } from "@/lib/db";
import { runScheduledJob } from "@/lib/admin/scheduled-job-service";

const JOB_NAME_PREFIX = "integration-job-";

async function cleanupRows() {
  await db.scheduledJobRun.deleteMany({
    where: {
      jobName: {
        startsWith: JOB_NAME_PREFIX,
      },
    },
  });
  await db.scheduledJobLease.deleteMany({
    where: {
      jobName: {
        startsWith: JOB_NAME_PREFIX,
      },
    },
  });
}

function makeJobName(label: string) {
  return `${JOB_NAME_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe("scheduled job service", () => {
  beforeEach(async () => {
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("skips duplicate runs while another active lease is held", async () => {
    const jobName = makeJobName("duplicate");
    let releaseFirstRun: (() => void) | null = null;
    const secondRunSpy = vi.fn();

    const firstRun = runScheduledJob({
      jobName,
      triggerType: ScheduledJobTriggerType.manual,
      run: async () =>
        new Promise<{ processed: number }>((resolve) => {
          releaseFirstRun = () => resolve({ processed: 1 });
        }),
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const skippedRun = await runScheduledJob({
      jobName,
      triggerType: ScheduledJobTriggerType.manual,
      run: async () => {
        secondRunSpy();
        return { processed: 2 };
      },
    });

    expect(skippedRun.run.status).toBe("skipped");
    expect(skippedRun.result).toMatchObject({
      skipped: true,
      reason: "active_lease",
    });
    expect(secondRunSpy).not.toHaveBeenCalled();

    releaseFirstRun?.();
    const completed = await firstRun;
    expect(completed.run.status).toBe("succeeded");
  });

  it("reuses a stale lease instead of remaining blocked forever", async () => {
    const jobName = makeJobName("stale");

    await db.scheduledJobLease.create({
      data: {
        jobName,
        leaseId: "stale-lease-id",
        leasedUntil: new Date(Date.now() - 60_000),
      },
    });

    const result = await runScheduledJob({
      jobName,
      triggerType: ScheduledJobTriggerType.manual,
      run: async () => ({ processed: 3 }),
    });

    expect(result.run.status).toBe("succeeded");
    expect(result.result).toMatchObject({ processed: 3 });
  });
});
