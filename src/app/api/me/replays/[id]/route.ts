import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getReplayPlaybackAccess } from "@/lib/replay/service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const replay = await getReplayPlaybackAccess(id, user.id);
    return NextResponse.json(replay);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "REPLAY_EXPIRED") {
      return NextResponse.json({ message: "Replay access has expired." }, { status: 410 });
    }
    if (error instanceof Error && error.message === "REPLAY_NOT_READY") {
      return NextResponse.json({ message: "Replay is still processing." }, { status: 409 });
    }
    console.error("GET /api/me/replays/[id] failed", error);
    return NextResponse.json({ message: "Failed to load replay" }, { status: 500 });
  }
}
