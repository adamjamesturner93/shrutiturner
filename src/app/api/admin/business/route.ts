import { connection, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { getAdminBusinessSummary } from "@/lib/admin/business-service";

export async function GET() {
  try {
    await connection();
    await requireAdminUser();
    const summary = await getAdminBusinessSummary();
    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/business failed", error);
    return NextResponse.json({ message: "Failed to load business summary" }, { status: 500 });
  }
}
