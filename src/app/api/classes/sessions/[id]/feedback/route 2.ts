import { NextResponse } from "next/server";
import type { SessionFeedbackRequestDto } from "@/lib/api/types";
import { requireSessionUser } from "@/lib/api/auth-user";
import { saveSessionFeedback } from "@/lib/classes/feedback-service";

function parseBody(body: unknown): SessionFeedbackRequestDto | null {
  if (!body || typeof body !== "object") return null;

  const stage = "stage" in body ? body.stage : undefined;
  if (stage === "pre") {
    const energyLevel = "energyLevel" in body ? body.energyLevel : undefined;
    const flareToday = "flareToday" in body ? body.flareToday : undefined;
    if (typeof energyLevel !== "number" || !Number.isInteger(energyLevel)) return null;
    if (energyLevel < 1 || energyLevel > 5) return null;
    if (flareToday !== undefined && typeof flareToday !== "boolean") return null;
    return {
      stage,
      energyLevel: energyLevel as 1 | 2 | 3 | 4 | 5,
      flareToday: typeof flareToday === "boolean" ? flareToday : false,
    };
  }

  if (stage === "post") {
    const feeling = "feeling" in body ? body.feeling : undefined;
    if (
      feeling !== "great" &&
      feeling !== "good" &&
      feeling !== "okay" &&
      feeling !== "tough" &&
      feeling !== "too-much"
    ) {
      return null;
    }
    return {
      stage,
      feeling,
    };
  }

  return null;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const body = parseBody(await request.json().catch(() => null));

    if (!body) {
      return NextResponse.json({ message: "Invalid feedback payload" }, { status: 400 });
    }

    const saved = await saveSessionFeedback({
      sessionId: id,
      userId: user.id,
      input: body,
    });

    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "INVALID_PRE_FEEDBACK" || error.message === "INVALID_POST_FEEDBACK") {
        return NextResponse.json({ message: "Invalid feedback payload" }, { status: 400 });
      }
      if (error.message === "BOOKING_NOT_FOUND") {
        return NextResponse.json({ message: "Booking not found" }, { status: 404 });
      }
    }

    console.error("POST /api/classes/sessions/[id]/feedback failed", error);
    return NextResponse.json({ message: "Failed to save feedback" }, { status: 500 });
  }
}
