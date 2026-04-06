import { NextResponse } from "next/server";
import { ScheduledJobTriggerType } from "@prisma/client";
import { runScheduledJob } from "@/lib/admin/scheduled-job-service";
import { cleanupExpiredReplayAssets } from "@/lib/replay/service";

function isAuthorized(request: Request) {
  const secret =
    process.env.REPLAY_CLEANUP_CRON_SECRET || process.env.SUBSCRIPTION_COMPLIANCE_CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { result } = await runScheduledJob({
      jobName: "replay_cleanup",
      triggerType: ScheduledJobTriggerType.cron,
      run: () => cleanupExpiredReplayAssets(),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/internal/replays/cleanup failed", error);
    return NextResponse.json({ message: "Failed to clean up replays" }, { status: 500 });
  }
}
