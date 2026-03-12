import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { cancelClassSession } from "@/lib/classes/booking-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { reason?: string };

    const result = await cancelClassSession(
      id,
      adminUser.id,
      typeof body.reason === "string" ? body.reason : undefined
    );

    return NextResponse.json(result);
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
    console.error("POST /api/admin/classes/sessions/[id]/cancel failed", error);
    return NextResponse.json({ message: "Failed to cancel class session" }, { status: 500 });
  }
}
