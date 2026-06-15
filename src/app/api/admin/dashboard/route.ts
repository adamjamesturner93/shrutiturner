import { connection, NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { getAdminDashboardSummary } from "@/lib/admin/dashboard-service";

export async function GET() {
  await connection();

  try {
    await requireStaffAdminUser();
    const summary = await getAdminDashboardSummary();
    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/dashboard failed", error);
    return NextResponse.json(
      { message: "Failed to load admin dashboard summary" },
      { status: 500 }
    );
  }
}
