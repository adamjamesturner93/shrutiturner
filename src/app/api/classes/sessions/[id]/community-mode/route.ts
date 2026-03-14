import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getSessionAccessContext, setCommunityMode } from "@/lib/classes/attendance-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await requireSessionUser();
    const { id } = await context.params;
    const access = await getSessionAccessContext(id, sessionUser.id);

    if (!access) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }
    if (!access.isModerator) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as { enabled?: boolean };
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ message: "Invalid community mode value" }, { status: 400 });
    }

    const session = await setCommunityMode({ sessionId: id, enabled: body.enabled });
    return NextResponse.json({
      communityModeEnabled: session.communityModeEnabled,
      communityModeUpdatedAt: session.communityModeUpdatedAt?.toISOString() || null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/classes/sessions/[id]/community-mode failed", error);
    return NextResponse.json({ message: "Failed to update community mode" }, { status: 500 });
  }
}
