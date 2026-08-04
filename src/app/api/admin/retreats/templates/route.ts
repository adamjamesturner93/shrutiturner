import { connection, NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { getAdminRetreatTemplates } from "@/lib/retreats/service";

export async function GET() {
  await connection();
  try {
    await requireStaffAdminUser();
    return NextResponse.json(await getAdminRetreatTemplates());
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/retreats/templates failed", error);
    return NextResponse.json(
      { message: "Failed to load Contentful experiences." },
      { status: 500 }
    );
  }
}
