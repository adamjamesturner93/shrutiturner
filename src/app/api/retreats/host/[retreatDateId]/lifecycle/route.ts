import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { startRoomRecording, stopRoomRecording } from "@/lib/daily/service";
import {
  getRetreatHostTokenContext,
  updateRetreatLiveRecordingState,
  updateRetreatLiveLifecycle,
} from "@/lib/retreats/live-service";

type Action =
  | "start"
  | "end"
  | "enable_chat"
  | "disable_chat"
  | "start_recording"
  | "stop_recording";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ retreatDateId: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { retreatDateId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { action?: Action };
    if (!body.action) return NextResponse.json({ message: "Action is required." }, { status: 400 });
    if (body.action === "start_recording" || body.action === "stop_recording") {
      const access = await getRetreatHostTokenContext(retreatDateId, user.id);
      if (!access.canRecord)
        return NextResponse.json({ message: "Recording is disabled." }, { status: 403 });
      try {
        const recording =
          body.action === "start_recording"
            ? await startRoomRecording(access.roomName)
            : await stopRoomRecording(access.roomName);
        const recordingState = body.action === "start_recording" ? "recording" : "stopped";
        await updateRetreatLiveRecordingState(retreatDateId, recordingState);
        return NextResponse.json({ recording, recordingState });
      } catch (error) {
        await updateRetreatLiveRecordingState(retreatDateId, "failed");
        throw error;
      }
    }
    const retreatDate = await updateRetreatLiveLifecycle({
      retreatDateId,
      userId: user.id,
      action: body.action,
    });
    return NextResponse.json({
      roomState: retreatDate.liveRoomState,
      chatEnabled: retreatDate.chatEnabled && !retreatDate.liveChatDisabledAt,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "UNAUTHORIZED")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (code === "FORBIDDEN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    console.error("PATCH retreat lifecycle failed", error);
    return NextResponse.json({ message: "Unable to update the retreat session." }, { status: 500 });
  }
}
