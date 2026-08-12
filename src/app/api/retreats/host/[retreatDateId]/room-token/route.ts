import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { createMeetingToken, isDailyConfigured } from "@/lib/daily/service";
import { getRetreatHostTokenContext } from "@/lib/retreats/live-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ retreatDateId: string }> }
) {
  try {
    if (!isDailyConfigured()) {
      return NextResponse.json({ message: "Online video is not configured." }, { status: 503 });
    }
    const user = await requireSessionUser();
    const { retreatDateId } = await context.params;
    const access = await getRetreatHostTokenContext(retreatDateId, user.id);
    const token = await createMeetingToken({
      roomName: access.roomName,
      userId: user.id,
      userName: access.userName,
      isOwner: true,
      expiresAt: access.expiresAt,
      permissions: { hasPresence: true, canSend: true, canReceive: { base: true }, canAdmin: true },
    });
    return NextResponse.json({
      token,
      roomUrl: access.roomUrl,
      participantRole: access.participantRole,
      roomState: access.roomState,
      displayMode: access.displayMode,
      displayVersion: access.displayVersion,
      focusedPresenterUserId: access.focusedPresenterUserId,
      communityModeEnabled: access.displayMode === "gallery",
      defaultMicMuted: false,
      defaultCameraOff: false,
      isRecorded: access.isRecorded,
      chatEnabled: access.chatEnabled,
      capabilities: {
        chat: access.chatEnabled,
        recording: access.canRecord,
        moderation: access.canModerate,
        publishReplay: access.canPublishReplay,
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "UNAUTHORIZED")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (code === "FORBIDDEN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    if (code === "NOT_FOUND")
      return NextResponse.json({ message: "Retreat not found" }, { status: 404 });
    console.error("POST retreat host room-token failed", error);
    return NextResponse.json({ message: "Unable to open the host room." }, { status: 500 });
  }
}
