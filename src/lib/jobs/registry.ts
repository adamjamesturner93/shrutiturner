import { ScheduledJobTriggerType } from "@prisma/client";
import { processDueSubscriptionComplianceNotices } from "@/lib/billing/subscription-compliance";
import { processThreeHourClassCutoff } from "@/lib/classes/booking-service";
import { env } from "@/lib/env";
import { processHealthDataRetention } from "@/lib/health/retention-service";
import { cleanupExpiredReplayAssets } from "@/lib/replay/service";

type JobHandlerResult = Record<string, unknown>;

export type RegisteredJob = {
  jobName: string;
  triggerTypes: ScheduledJobTriggerType[];
  previewSafe: boolean;
  run: () => Promise<JobHandlerResult>;
};

const registry: RegisteredJob[] = [
  {
    jobName: "class_three_hour_cutoff",
    triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
    previewSafe: true,
    run: () => processThreeHourClassCutoff(),
  },
  {
    jobName: "subscription_compliance_notices",
    triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
    previewSafe: true,
    run: () => processDueSubscriptionComplianceNotices(),
  },
  {
    jobName: "health_data_retention",
    triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
    previewSafe: false,
    run: () => processHealthDataRetention(),
  },
  {
    jobName: "replay_cleanup",
    triggerTypes: [ScheduledJobTriggerType.cron, ScheduledJobTriggerType.manual],
    previewSafe: true,
    run: () => cleanupExpiredReplayAssets(),
  },
  {
    jobName: "scheduler_heartbeat",
    triggerTypes: [ScheduledJobTriggerType.manual],
    previewSafe: true,
    run: async () => ({
      ok: true,
      environment: env.VERCEL_ENV || env.NODE_ENV,
      at: new Date().toISOString(),
    }),
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
