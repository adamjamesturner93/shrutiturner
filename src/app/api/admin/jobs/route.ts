import { NextResponse } from "next/server";
import { ScheduledJobTriggerType } from "@prisma/client";
import { requireOwnerAdminUser } from "@/lib/api/auth-user";
import { listScheduledJobRuns, runScheduledJob } from "@/lib/admin/scheduled-job-service";
import { processThreeHourClassCutoff } from "@/lib/classes/booking-service";
import { processHealthDataRetention } from "@/lib/health/retention-service";
import { cleanupExpiredReplayAssets } from "@/lib/replay/service";
import { processDueSubscriptionComplianceNotices } from "@/lib/billing/subscription-compliance";

const MANUAL_JOBS: Record<string, () => Promise<Record<string, unknown>>> = {
  class_three_hour_cutoff: () => processThreeHourClassCutoff(),
  subscription_compliance_notices: () => processDueSubscriptionComplianceNotices(),
  health_data_retention: () => processHealthDataRetention(),
  replay_cleanup: () => cleanupExpiredReplayAssets(),
};

export async function GET() {
  try {
    await requireOwnerAdminUser();
    const runs = await listScheduledJobRuns();
    return NextResponse.json(runs);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/jobs failed", error);
    return NextResponse.json({ message: "Failed to load scheduled jobs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireOwnerAdminUser();
    const body = (await request.json().catch(() => ({}))) as { jobName?: string };
    if (!body.jobName || !(body.jobName in MANUAL_JOBS)) {
      return NextResponse.json({ message: "Invalid job name." }, { status: 400 });
    }
    const { run, result } = await runScheduledJob({
      jobName: body.jobName,
      triggerType: ScheduledJobTriggerType.manual,
      actorUserId: admin.id,
      run: MANUAL_JOBS[body.jobName],
    });
    return NextResponse.json({ run, result });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("POST /api/admin/jobs failed", error);
    return NextResponse.json({ message: "Failed to run job" }, { status: 500 });
  }
}
