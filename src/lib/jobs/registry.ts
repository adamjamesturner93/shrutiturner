import { ScheduledJobTriggerType } from "@prisma/client";
import { env } from "@/lib/env";
import { cleanupScheduledJobRuntimeData } from "@/lib/jobs/runtime-maintenance";
import { processTransactionalEmailRetries } from "@/lib/jobs/transactional-email";
import { processDueContentfulCampaigns } from "@/lib/newsletter/campaign-automation";
import { maintainRetreatLiveSessions } from "@/lib/retreats/live-jobs";

type JobHandlerResult = Record<string, unknown>;

export type RegisteredJob = {
  jobName: string;
  triggerTypes: ScheduledJobTriggerType[];
  previewSafe: boolean;
  run: () => Promise<JobHandlerResult>;
};

const registry: RegisteredJob[] = [
  {
    jobName: "retreat_live_maintenance",
    triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
    previewSafe: false,
    run: () => maintainRetreatLiveSessions(),
  },
  {
    jobName: "scheduled_job_runtime_cleanup",
    triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
    previewSafe: true,
    run: () => cleanupScheduledJobRuntimeData(),
  },
  {
    jobName: "scheduler_heartbeat",
    triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
    previewSafe: true,
    run: async () => ({
      ok: true,
      environment: env.VERCEL_ENV || env.NODE_ENV,
      at: new Date().toISOString(),
    }),
  },
  {
    jobName: "transactional_email_retry",
    triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
    previewSafe: true,
    run: () => processTransactionalEmailRetries(),
  },
  {
    jobName: "contentful_campaign_send",
    triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
    previewSafe: false,
    run: () => processDueContentfulCampaigns(),
  },
];

export function listRegisteredJobs() {
  return registry.map((job) => ({
    jobName: job.jobName,
    triggerTypes: job.triggerTypes,
    previewSafe: job.previewSafe,
  }));
}

export function getRegisteredJob(jobName: string, triggerType: ScheduledJobTriggerType) {
  const job = registry.find((entry) => entry.jobName === jobName);
  if (!job || !job.triggerTypes.includes(triggerType)) {
    return null;
  }

  const isPreview = env.VERCEL_ENV === "preview";
  if (isPreview && !job.previewSafe) {
    return null;
  }

  return job;
}
