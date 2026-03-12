import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { bookClassSession } from "@/lib/classes/booking-service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const result = await bookClassSession(id, user.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (
      error instanceof Error &&
      [
        "SESSION_NOT_FOUND",
        "SESSION_NOT_BOOKABLE",
        "SESSION_STARTED",
        "BOOKING_LIMIT_REACHED",
      ].includes(error.message)
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("POST /api/classes/sessions/[id]/book failed", error);
    return NextResponse.json({ message: "Failed to book class" }, { status: 500 });
  }
}
