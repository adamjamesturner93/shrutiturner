import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getClassSessionDetail } from "@/lib/classes/session-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();
    const detail = await getClassSessionDetail(id, session?.user?.id);
    if (!detail) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    console.error("GET /api/classes/sessions/[id] failed", error);
    return NextResponse.json({ message: "Failed to load session" }, { status: 500 });
  }
}
