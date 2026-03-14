import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getSessionAccessContext, getRoomTokenAccess } from "@/lib/classes/attendance-service";
import { createMeetingToken, isDailyConfigured } from "@/lib/daily/service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isDailyConfigured()) {
      return NextResponse.json({ message: "Daily is not configured" }, { status: 503 });
    }

    const sessionUser = await requireSessionUser();
    const { id } = await context.params;
    const [access, contextData] = await Promise.all([
      getRoomTokenAccess(id, sessionUser.id),
      getSessionAccessContext(id, sessionUser.id),
    ]);

    if (!contextData) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }

    const token = await createMeetingToken({
      roomName: access.roomName,
      userId: sessionUser.id,
      userName: access.userName,
      isOwner: access.isOwner,
      expiresAt: new Date(new Date(contextData.session.endsAtUtc).getTime() + 2 * 60 * 60 * 1000),
    });

    return NextResponse.json({
      token,
      roomUrl: access.roomUrl,
      isOwner: access.isOwner,
      communityModeEnabled: contextData.session.communityModeEnabled,
      lateJoinCutoffAt: access.lateJoinCutoffAt.toISOString(),
      hasPreviouslyJoinedCurrentUser: access.hasPreviouslyJoined,
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
    if (error instanceof Error && error.message === "ROOM_NOT_READY") {
      return NextResponse.json({ message: "The live room is not ready yet." }, { status: 409 });
    }
    console.error("POST /api/classes/sessions/[id]/room-token failed", error);
    return NextResponse.json({ message: "Failed to issue room token" }, { status: 500 });
  }
}
