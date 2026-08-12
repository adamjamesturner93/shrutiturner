import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { publishRetreatReplay, revokeRetreatReplay } from "@/lib/replay/service";
import { getAdminRetreatDetail } from "@/lib/retreats/service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: "publish" | "revoke";
      replayAssetId?: string;
    };
    if (!body.replayAssetId || !body.action) {
      return NextResponse.json({ message: "Replay and action are required." }, { status: 400 });
    }
    const result =
      body.action === "publish"
        ? await publishRetreatReplay(body.replayAssetId, id, admin.id)
        : await revokeRetreatReplay(body.replayAssetId, id, admin.id);
    void result;
    return NextResponse.json(await getAdminRetreatDetail(id));
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "UNAUTHORIZED")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (code === "FORBIDDEN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    if (code === "REPLAY_NOT_FOUND")
      return NextResponse.json({ message: "Replay not found." }, { status: 404 });
    if (code === "REPLAY_NOT_READY")
      return NextResponse.json({ message: "Replay is not ready." }, { status: 409 });
    return NextResponse.json({ message: "Unable to update replay access." }, { status: 500 });
  }
}
