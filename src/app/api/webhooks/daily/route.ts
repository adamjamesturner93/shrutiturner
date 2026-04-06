import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordAttendanceEvent } from "@/lib/classes/attendance-service";
import { verifyDailyWebhookAuthorization } from "@/lib/daily/service";
import { syncReplayAssetFromDailyWebhook } from "@/lib/replay/service";

type DailyWebhookPayload = {
  event?: string;
  type?: string;
  room?: string;
  room_name?: string;
  data?: {
    room?: string;
    room_name?: string;
    recording_id?: string;
    playback_url?: string;
    status?: string;
    started_at?: string;
    completed_at?: string;
    participant?: {
      user_id?: string;
      session_id?: string;
    };
  };
  recording_id?: string;
  playback_url?: string;
  status?: string;
  started_at?: string;
  completed_at?: string;
  participant?: {
    user_id?: string;
    session_id?: string;
  };
};

function getRoomName(payload: DailyWebhookPayload) {
  return payload.room_name || payload.room || payload.data?.room_name || payload.data?.room || null;
}

function getUserId(payload: DailyWebhookPayload) {
  return payload.participant?.user_id || payload.data?.participant?.user_id || null;
}

function getParticipantId(payload: DailyWebhookPayload) {
  return payload.participant?.session_id || payload.data?.participant?.session_id || null;
}

function getAttendanceType(payload: DailyWebhookPayload): "joined" | "left" | null {
  const token = payload.event || payload.type || "";
  if (token.includes("join")) return "joined";
  if (token.includes("left") || token.includes("leave")) return "left";
  return null;
}

function isRecordingEvent(payload: DailyWebhookPayload) {
  const token = `${payload.event || ""} ${payload.type || ""}`.toLowerCase();
  return (
    token.includes("record") ||
    Boolean(
      payload.recording_id ||
      payload.data?.recording_id ||
      payload.playback_url ||
      payload.data?.playback_url
    )
  );
}

export async function POST(request: Request) {
  try {
    if (!verifyDailyWebhookAuthorization(request.headers)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json().catch(() => null)) as DailyWebhookPayload | null;
    if (!payload) {
      return NextResponse.json({ ignored: true });
    }

    const roomName = getRoomName(payload);
    const userId = getUserId(payload);
    const type = getAttendanceType(payload);

    if (roomName && isRecordingEvent(payload)) {
      await syncReplayAssetFromDailyWebhook({
        roomName,
        recordingId: payload.recording_id || payload.data?.recording_id || null,
        playbackUrl: payload.playback_url || payload.data?.playback_url || null,
        status: payload.status || payload.data?.status || payload.event || payload.type || null,
        startedAt: payload.started_at || payload.data?.started_at || null,
        completedAt: payload.completed_at || payload.data?.completed_at || null,
        payload: payload as Record<string, unknown>,
      }).catch((error) => {
        console.error("Daily replay sync failed", error);
      });
    }

    if (!roomName || !userId || !type) {
      return NextResponse.json({ ignored: true });
    }

    const session = await db.classSession.findFirst({
      where: {
        dailyRoomName: roomName,
      },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json({ ignored: true });
    }

    await recordAttendanceEvent({
      sessionId: session.id,
      userId,
      type,
      dailyParticipantId: getParticipantId(payload),
      payload: payload as Record<string, unknown>,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/webhooks/daily failed", error);
    return NextResponse.json({ message: "Failed to process Daily webhook" }, { status: 500 });
  }
}
