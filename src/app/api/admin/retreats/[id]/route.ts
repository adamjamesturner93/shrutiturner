import { connection, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { getAdminRetreatDetail } from "@/lib/retreats/service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connection();
    await requireAdminUser();
    const { id } = await context.params;
    const detail = await getAdminRetreatDetail(id);
    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Retreat not found." }, { status: 404 });
    }
    console.error("GET /api/admin/retreats/[id] failed", error);
    return NextResponse.json({ message: "Failed to load retreat detail." }, { status: 500 });
  }
}
