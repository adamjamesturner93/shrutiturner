import { NextResponse } from "next/server";
import { requireOwnerAdminUser } from "@/lib/api/auth-user";
import { createPrivacyExportRequest } from "@/lib/privacy/service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireOwnerAdminUser();
    const { id } = await context.params;
    const result = await createPrivacyExportRequest(admin.id, id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("POST /api/admin/members/[id]/privacy/export failed", error);
    return NextResponse.json({ message: "Failed to generate export" }, { status: 500 });
  }
}
