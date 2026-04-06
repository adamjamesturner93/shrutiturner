import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import {
  blockSessionParticipant,
  listSessionModerationHistory,
  removeSessionParticipant,
  unblockSessionParticipant,
} from "@/lib/classes/moderation-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const history = await listSessionModerationHistory(id, user.id);
    return NextResponse.json(history);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/classes/sessions/[id]/moderation failed", error);
    return NextResponse.json({ message: "Failed to load moderation history" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      userId?: string;
      reason?: string;
    };

    if (typeof body.userId !== "string" || typeof body.reason !== "string") {
      return NextResponse.json(
        { message: "Participant and reason are required." },
        { status: 400 }
      );
    }

    if (body.action === "remove") {
      const result = await removeSessionParticipant({
        sessionId: id,
        userId: body.userId,
        actorUserId: user.id,
        reason: body.reason,
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (body.action === "block") {
      const result = await blockSessionParticipant({
        sessionId: id,
        userId: body.userId,
        actorUserId: user.id,
        reason: body.reason,
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (body.action === "unblock") {
      const result = await unblockSessionParticipant({
        sessionId: id,
        userId: body.userId,
        actorUserId: user.id,
        reason: body.reason,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ message: "Unsupported moderation action." }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "MODERATION_REASON_REQUIRED") {
      return NextResponse.json({ message: "A moderation reason is required." }, { status: 400 });
    }
    console.error("POST /api/classes/sessions/[id]/moderation failed", error);
    return NextResponse.json({ message: "Failed to moderate participant" }, { status: 500 });
  }
}
