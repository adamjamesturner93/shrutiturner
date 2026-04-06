import { NextResponse } from "next/server";
import { ScheduledJobTriggerType } from "@prisma/client";
import { runScheduledJob } from "@/lib/admin/scheduled-job-service";
import { processHealthDataRetention } from "@/lib/health/retention-service";

function isAuthorized(request: Request) {
  const secret =
    process.env.HEALTH_RETENTION_CRON_SECRET || process.env.SUBSCRIPTION_COMPLIANCE_CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { result } = await runScheduledJob({
      jobName: "health_data_retention",
      triggerType: ScheduledJobTriggerType.cron,
      run: () => processHealthDataRetention(),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/internal/health/retention failed", error);
    return NextResponse.json({ message: "Failed to process health retention" }, { status: 500 });
  }
}
