import { NextResponse } from "next/server";
import { ScheduledJobTriggerType } from "@prisma/client";
import { runScheduledJob } from "@/lib/admin/scheduled-job-service";
import { env } from "@/lib/env";
import { getRegisteredJob } from "@/lib/jobs/registry";

function isAuthorized(request: Request) {
  if (!env.INTERNAL_JOB_SECRET) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${env.INTERNAL_JOB_SECRET}`;
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ jobName: string }>;
  }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { jobName } = await context.params;
  const job = getRegisteredJob(jobName, ScheduledJobTriggerType.cron);

  if (!job) {
    return NextResponse.json({ message: "Unknown or unavailable job." }, { status: 404 });
  }

  try {
    const { result } = await runScheduledJob({
      jobName,
      triggerType: ScheduledJobTriggerType.cron,
      run: job.run,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error(`POST /api/internal/jobs/${jobName} failed`, error);
    return NextResponse.json({ message: "Failed to execute scheduled job." }, { status: 500 });
  }
}
