import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { listReplayAssetsForUser } from "@/lib/replay/service";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const assets = await listReplayAssetsForUser(user.id);
    return NextResponse.json(assets);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/me/replays failed", error);
    return NextResponse.json({ message: "Failed to load replays" }, { status: 500 });
  }
}
