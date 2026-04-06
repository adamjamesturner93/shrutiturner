import { NextResponse } from "next/server";
import { ScheduledJobTriggerType } from "@prisma/client";
import { runScheduledJob } from "@/lib/admin/scheduled-job-service";
import { processDueSubscriptionComplianceNotices } from "@/lib/billing/subscription-compliance";

function isAuthorized(request: Request) {
  const secret = process.env.SUBSCRIPTION_COMPLIANCE_CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { result } = await runScheduledJob({
      jobName: "subscription_compliance_notices",
      triggerType: ScheduledJobTriggerType.cron,
      run: () => processDueSubscriptionComplianceNotices(),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/internal/subscriptions/process-notices failed", error);
    return NextResponse.json(
      { message: "Failed to process subscription notices" },
      { status: 500 }
    );
  }
}
