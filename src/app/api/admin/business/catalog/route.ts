import { connection, NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { listBillingCatalog } from "@/lib/billing/catalog-service";

export async function GET() {
  try {
    await connection();
    await requireStaffAdminUser();
    const rows = await listBillingCatalog();
    return NextResponse.json(rows.filter(Boolean));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/business/catalog failed", error);
    return NextResponse.json({ message: "Failed to load billing catalog" }, { status: 500 });
  }
}
