import { NextResponse } from "next/server";
import { ScheduledJobTriggerType } from "@prisma/client";
import { runScheduledJob } from "@/lib/admin/scheduled-job-service";
import { processThreeHourClassCutoff } from "@/lib/classes/booking-service";

function isAuthorized(request: Request) {
  const secret =
    process.env.CLASS_CUTOFF_CRON_SECRET || process.env.SUBSCRIPTION_COMPLIANCE_CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { result } = await runScheduledJob({
      jobName: "class_three_hour_cutoff",
      triggerType: ScheduledJobTriggerType.cron,
      run: () => processThreeHourClassCutoff(),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/internal/classes/process-three-hour-cutoff failed", error);
    return NextResponse.json({ message: "Failed to process class cutoff" }, { status: 500 });
  }
}
