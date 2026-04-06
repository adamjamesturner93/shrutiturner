import { connection, NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { getAdminRetreatSummaries } from "@/lib/retreats/service";

export async function GET() {
  try {
    await connection();
    await requireStaffAdminUser();
    const data = await getAdminRetreatSummaries();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/retreats failed", error);
    return NextResponse.json({ message: "Failed to load retreats." }, { status: 500 });
  }
}
