import { ScheduledJobTriggerType } from "@prisma/client";
import { listScheduledJobRuns, runScheduledJob } from "@/lib/admin/scheduled-job-service";
import { apiOk, badRequest, handleApiRoute, parseJsonBody } from "@/lib/api/route";
import { getRegisteredJob, listRegisteredJobs } from "@/lib/jobs/registry";

type JobBody = {
  jobName?: string;
};

export const GET = handleApiRoute(
  async () => {
    const [runs, jobs] = await Promise.all([
      listScheduledJobRuns(),
      Promise.resolve(listRegisteredJobs()),
    ]);
    return apiOk({ jobs, runs });
  },
  { auth: "owner_admin" }
);

export const POST = handleApiRoute(
  async ({ request, sessionUser }) => {
    const body = await parseJsonBody<JobBody>(request);
    if (!body.jobName) {
      throw badRequest("Invalid job name.");
    }

    const job = getRegisteredJob(body.jobName, ScheduledJobTriggerType.manual);
    if (!job) {
      throw badRequest("Invalid or unavailable job name.");
    }

    const { run, result } = await runScheduledJob({
      jobName: body.jobName,
      triggerType: ScheduledJobTriggerType.manual,
      actorUserId: sessionUser?.id || null,
      run: job.run,
    });

    return apiOk({ run, result });
  },
  { auth: "owner_admin" }
);
