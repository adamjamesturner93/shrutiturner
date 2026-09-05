import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { createMeetingToken, isDailyConfigured } from "@/lib/daily/service";
import {
  buildRetreatParticipantPermissions,
  getRetreatParticipantTokenContext,
} from "@/lib/retreats/live-service";
import { isAcceptanceRequiredError } from "@/lib/legal/acceptance-service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isDailyConfigured()) {
      return NextResponse.json({ message: "Online video is not configured." }, { status: 503 });
    }
    const user = await requireSessionUser();
    const { id } = await context.params;
    const access = await getRetreatParticipantTokenContext(id, user.id);
    const token = await createMeetingToken({
      roomName: access.roomName,
      userId: user.id,
      userName: access.userName,
      isOwner: false,
      expiresAt: access.expiresAt,
      permissions: buildRetreatParticipantPermissions({
        mode: access.displayMode,
        focusedPresenterUserId: access.focusedPresenterUserId,
      }),
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
      defaultMicMuted: access.defaultMicMuted,
      defaultCameraOff: access.defaultCameraOff,
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
    if (isAcceptanceRequiredError(error)) {
      return NextResponse.json(error.details, { status: 409 });
    }
    const code = error instanceof Error ? error.message : "";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Sign in to join this workshop." }, { status: 401 });
    }
    if (code === "NOT_FOUND") {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }
    if (code === "FORBIDDEN" || code === "PAYMENT_REQUIRED") {
      return NextResponse.json(
        { message: "This booking does not include live access." },
        { status: 403 }
      );
    }
    if (code === "EARLY_JOIN_WINDOW") {
      return NextResponse.json({ message: "The online room is not open yet." }, { status: 403 });
    }
    if (code === "ROOM_CLOSED") {
      return NextResponse.json({ message: "The live access window has ended." }, { status: 403 });
    }
    if (code === "ROOM_NOT_READY") {
      return NextResponse.json({ message: "The online room is not ready yet." }, { status: 409 });
    }
    console.error("POST /api/retreats/bookings/[id]/room-token failed", error);
    return NextResponse.json({ message: "Unable to open the online room." }, { status: 500 });
  }
}
