import { connection, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getMyCoachingState } from "@/lib/coaching/service";

export async function GET() {
  try {
    await connection();
    const user = await requireSessionUser();
    const state = await getMyCoachingState(user.id);
    return NextResponse.json(state);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/me/coaching failed", error);
    return NextResponse.json({ message: "Failed to load coaching state." }, { status: 500 });
  }
}
