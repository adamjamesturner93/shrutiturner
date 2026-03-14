import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { recordAttendanceEvent } from "@/lib/classes/attendance-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await requireSessionUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      type?: string;
      dailyParticipantId?: string;
      occurredAt?: string;
      payload?: Record<string, unknown>;
    };

    if (!body.type || !["joined", "left"].includes(body.type)) {
      return NextResponse.json({ message: "Invalid attendance event type" }, { status: 400 });
    }

    const result = await recordAttendanceEvent({
      sessionId: id,
      userId: sessionUser.id,
      type: body.type as "joined" | "left",
      dailyParticipantId: body.dailyParticipantId || null,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
      payload: body.payload || null,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/classes/sessions/[id]/attendance failed", error);
    return NextResponse.json({ message: "Failed to record attendance" }, { status: 500 });
  }
}
