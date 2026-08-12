import { ScheduledJobTriggerType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cleanupScheduledJobRuntimeDataMock = vi.fn();
const processTransactionalEmailRetriesMock = vi.fn();
const processDueContentfulCampaignsMock = vi.fn();
const maintainRetreatLiveSessionsMock = vi.fn();

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

vi.mock("@/lib/newsletter/campaign-automation", () => ({
  processDueContentfulCampaigns: processDueContentfulCampaignsMock,
}));

vi.mock("@/lib/retreats/live-jobs", () => ({
  maintainRetreatLiveSessions: maintainRetreatLiveSessionsMock,
}));

const { getRegisteredJob, listRegisteredJobs } = await import("@/lib/jobs/registry");

describe("jobs registry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupScheduledJobRuntimeDataMock.mockResolvedValue({ ok: true });
    processTransactionalEmailRetriesMock.mockResolvedValue({ ok: true, attempted: 0 });
    processDueContentfulCampaignsMock.mockResolvedValue({
      ok: true,
      scanned: 0,
      processed: 0,
      failed: 0,
    });
    maintainRetreatLiveSessionsMock.mockResolvedValue({ rooms: {}, reminders: {}, chat: {} });
  });

  it("lists the email automation jobs", () => {
    expect(listRegisteredJobs()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jobName: "transactional_email_retry",
          triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
          previewSafe: true,
        }),
        expect.objectContaining({
          jobName: "contentful_campaign_send",
          triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
          previewSafe: false,
        }),
        expect.objectContaining({
          jobName: "retreat_live_maintenance",
          triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
          previewSafe: false,
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

  it("returns a runnable Contentful campaign send handler", async () => {
    const job = getRegisteredJob("contentful_campaign_send", ScheduledJobTriggerType.manual);

    expect(job).not.toBeNull();
    await expect(job?.run()).resolves.toEqual({
      ok: true,
      scanned: 0,
      processed: 0,
      failed: 0,
    });
    expect(processDueContentfulCampaignsMock).toHaveBeenCalledTimes(1);
  });
});
