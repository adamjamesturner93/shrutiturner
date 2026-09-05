import { RetreatLiveDisplayMode } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { updateRetreatDisplayMode } from "@/lib/retreats/live-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ retreatDateId: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { retreatDateId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      mode?: string;
      focusedPresenterUserId?: string | null;
    };
    if (
      !body.mode ||
      !Object.values(RetreatLiveDisplayMode).includes(body.mode as RetreatLiveDisplayMode)
    ) {
      return NextResponse.json({ message: "Invalid display mode." }, { status: 400 });
    }
    const result = await updateRetreatDisplayMode({
      retreatDateId,
      userId: user.id,
      mode: body.mode as RetreatLiveDisplayMode,
      focusedPresenterUserId: body.focusedPresenterUserId,
    });
    return NextResponse.json({
      displayMode: result.retreatDate.liveDisplayMode,
      displayVersion: result.retreatDate.liveDisplayVersion,
      focusedPresenterUserId: result.retreatDate.focusedPresenterUserId,
      dailySyncStatus: result.dailySyncStatus,
      dailySyncError: result.dailySyncError || null,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "UNAUTHORIZED")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (code === "FORBIDDEN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    return NextResponse.json({ message: "Unable to update display mode." }, { status: 500 });
  }
}
