import { connection, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getDashboardSummary } from "@/lib/dashboard/dashboard-service";

export async function GET() {
  try {
    await connection();
    const user = await requireSessionUser();
    const summary = await getDashboardSummary(user.id);
    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/me/dashboard failed", error);
    return NextResponse.json({ message: "Failed to load dashboard summary" }, { status: 500 });
  }
}
