import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSessionAccessScope } from "@/lib/authz/access";
import { getClassSessionDetailForScope } from "@/lib/classes/session-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();
    const scope = await getSessionAccessScope(session?.user?.id, id);
    const detail = await getClassSessionDetailForScope(id, session?.user?.id, scope);
    if (!detail) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    console.error("GET /api/classes/sessions/[id] failed", error);
    return NextResponse.json({ message: "Failed to load session" }, { status: 500 });
  }
}
