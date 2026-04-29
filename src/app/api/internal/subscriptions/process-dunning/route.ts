import { NextResponse } from "next/server";
import { ScheduledJobTriggerType } from "@prisma/client";
import { runScheduledJob } from "@/lib/admin/scheduled-job-service";
import { processDueMembershipDunningCases } from "@/lib/billing/dunning-service";

function isAuthorized(request: Request) {
  const secret = process.env.SUBSCRIPTION_COMPLIANCE_CRON_SECRET || process.env.INTERNAL_JOB_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { result } = await runScheduledJob({
      jobName: "membership_dunning",
      triggerType: ScheduledJobTriggerType.cron,
      run: () => processDueMembershipDunningCases(),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/internal/subscriptions/process-dunning failed", error);
    return NextResponse.json({ message: "Failed to process membership dunning" }, { status: 500 });
  }
}
