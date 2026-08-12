import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { recordRetreatAttendanceEvent } from "@/lib/retreats/live-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      type?: string;
      dailyParticipantId?: string;
    };
    if ((body.type !== "joined" && body.type !== "left") || !body.dailyParticipantId) {
      return NextResponse.json({ message: "Invalid attendance event." }, { status: 400 });
    }
    await recordRetreatAttendanceEvent({
      bookingId: id,
      userId: user.id,
      dailySessionId: body.dailyParticipantId,
      type: body.type,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { message: code === "FORBIDDEN" ? "Forbidden" : "Unable to record attendance." },
      { status: code === "FORBIDDEN" ? 403 : 500 }
    );
  }
}
