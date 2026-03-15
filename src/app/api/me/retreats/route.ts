import { connection, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getMyRetreatBookings } from "@/lib/retreats/service";

export async function GET() {
  try {
    await connection();
    const user = await requireSessionUser();
    const bookings = await getMyRetreatBookings(user.id);
    return NextResponse.json(bookings);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/me/retreats failed", error);
    return NextResponse.json({ message: "Failed to load retreat bookings." }, { status: 500 });
  }
}
