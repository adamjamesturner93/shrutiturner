import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { getClassSessionDetail, setUpSessionRoom } from "@/lib/classes/session-service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireAdminUser();
    const { id } = await context.params;
    await setUpSessionRoom(id);
    const detail = await getClassSessionDetail(id, adminUser.id);
    if (!detail) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "SESSION_NOT_FOUND") {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }

    console.error("POST /api/admin/classes/sessions/[id]/room-setup failed", error);
    return NextResponse.json({ message: "Failed to retry room setup" }, { status: 500 });
  }
}
