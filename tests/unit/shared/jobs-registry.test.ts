import { ScheduledJobTriggerType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cleanupScheduledJobRuntimeDataMock = vi.fn();
const processTransactionalEmailRetriesMock = vi.fn();

vi.mock("@/lib/env", () => ({
  env: {
    VERCEL_ENV: "production",
    NODE_ENV: "test",
  },
}));

vi.mock("@/lib/jobs/runtime-maintenance", () => ({
  cleanupScheduledJobRuntimeData: cleanupScheduledJobRuntimeDataMock,
}));

vi.mock("@/lib/jobs/transactional-email", () => ({
  processTransactionalEmailRetries: processTransactionalEmailRetriesMock,
}));

const { getRegisteredJob, listRegisteredJobs } = await import("@/lib/jobs/registry");

describe("jobs registry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupScheduledJobRuntimeDataMock.mockResolvedValue({ ok: true });
    processTransactionalEmailRetriesMock.mockResolvedValue({ ok: true, attempted: 0 });
  });

  it("lists the transactional email retry job", () => {
    expect(listRegisteredJobs()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jobName: "transactional_email_retry",
          triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
          previewSafe: true,
        }),
      ])
    );
  });

  it("returns a runnable transactional email retry handler", async () => {
    const job = getRegisteredJob("transactional_email_retry", ScheduledJobTriggerType.manual);

    expect(job).not.toBeNull();
    await expect(job?.run()).resolves.toEqual({ ok: true, attempted: 0 });
    expect(processTransactionalEmailRetriesMock).toHaveBeenCalledTimes(1);
  });
});
