import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getSessionAccessContext, getRoomTokenAccess } from "@/lib/classes/attendance-service";
import {
  buildSessionParticipantPermissions,
  getEffectiveSessionCommunityMode,
} from "@/lib/classes/live-room-service";
import { setUpSessionRoom } from "@/lib/classes/session-service";
import { createMeetingToken, isDailyConfigured } from "@/lib/daily/service";
import { getHealthAccessState } from "@/lib/health/health-service";
import {
  assertCurrentAcceptances,
  getPhysicalServiceAcceptanceRequirements,
  isAcceptanceRequiredError,
} from "@/lib/legal/acceptance-service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isDailyConfigured()) {
      return NextResponse.json({ message: "Daily is not configured" }, { status: 503 });
    }

    const sessionUser = await requireSessionUser();
    const healthAccess = await getHealthAccessState(sessionUser.id);
    if (!healthAccess.isComplete) {
      return NextResponse.json(
        { message: "Complete your health declaration before joining class." },
        { status: 403 }
      );
    }
    const { id } = await context.params;
    const contextData = await getSessionAccessContext(id, sessionUser.id);

    if (!contextData) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }

    await assertCurrentAcceptances(
      sessionUser.id,
      getPhysicalServiceAcceptanceRequirements("class_join")
    );

    if (!contextData.session.dailyRoomName || !contextData.session.dailyRoomUrl) {
      await setUpSessionRoom(id);
    }

    const access = await getRoomTokenAccess(id, sessionUser.id);

    const token = await createMeetingToken({
      roomName: access.roomName,
      userId: sessionUser.id,
      userName: access.userName,
      isOwner: access.isOwner,
      expiresAt: new Date(new Date(contextData.session.endsAtUtc).getTime() + 2 * 60 * 60 * 1000),
      permissions: buildSessionParticipantPermissions({
        typeSnapshot: contextData.session.typeSnapshot,
        capacity: contextData.session.capacity,
        communityModeEnabled: contextData.session.communityModeEnabled,
        communityModeUpdatedAt: contextData.session.communityModeUpdatedAt,
        isModerator: access.isOwner,
        moderatorUserIds: [contextData.session.instructorUserId],
      }).permissions,
    });

    return NextResponse.json({
      token,
      roomUrl: access.roomUrl,
      isOwner: access.isOwner,
      communityModeEnabled: getEffectiveSessionCommunityMode({
        typeSnapshot: contextData.session.typeSnapshot,
        capacity: contextData.session.capacity,
        communityModeEnabled: contextData.session.communityModeEnabled,
        communityModeUpdatedAt: contextData.session.communityModeUpdatedAt,
      }),
      lateJoinCutoffAt: access.lateJoinCutoffAt.toISOString(),
      hasPreviouslyJoinedCurrentUser: access.hasPreviouslyJoined,
      isRecorded: Boolean(contextData.session.isRecorded),
      defaultMicMuted: contextData.session.participantMicDefaultMuted,
      defaultCameraOff: contextData.session.participantCameraDefaultOff,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "SESSION_NOT_FOUND") {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "EARLY_JOIN_WINDOW") {
      return NextResponse.json({ message: "The live room is not open yet." }, { status: 403 });
    }
    if (error instanceof Error && error.message === "LATE_JOIN_CUTOFF") {
      return NextResponse.json(
        { message: "Warm-up has finished, so late joining is no longer available." },
        { status: 403 }
      );
    }
    if (error instanceof Error && error.message === "ROOM_CLOSED") {
      return NextResponse.json(
        { message: "The live room is no longer available." },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "PARTICIPANT_BLOCKED") {
      return NextResponse.json({ message: "You cannot re-enter this session." }, { status: 403 });
    }
    if (error instanceof Error && error.message === "ROOM_NOT_READY") {
      return NextResponse.json({ message: "The live room is not ready yet." }, { status: 409 });
    }
    if (isAcceptanceRequiredError(error)) {
      return NextResponse.json(error.details, { status: 409 });
    }
    console.error("POST /api/classes/sessions/[id]/room-token failed", error);
    return NextResponse.json({ message: "Failed to issue room token" }, { status: 500 });
  }
}
