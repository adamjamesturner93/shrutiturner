import { connection, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getMyRetreatBookingDetail } from "@/lib/retreats/service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connection();
    const user = await requireSessionUser();
    const { id } = await context.params;
    const booking = await getMyRetreatBookingDetail(user.id, id);
    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Retreat booking not found." }, { status: 404 });
    }
    console.error("GET /api/me/retreats/[id] failed", error);
    return NextResponse.json({ message: "Failed to load retreat booking." }, { status: 500 });
  }
}
