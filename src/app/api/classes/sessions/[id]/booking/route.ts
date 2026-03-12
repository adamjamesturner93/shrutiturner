import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { cancelOwnBooking } from "@/lib/classes/booking-service";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const result = await cancelOwnBooking(id, user.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/classes/sessions/[id]/booking failed", error);
    return NextResponse.json({ message: "Failed to cancel booking" }, { status: 500 });
  }
}
