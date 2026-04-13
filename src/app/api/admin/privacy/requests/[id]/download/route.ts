import { NextResponse } from "next/server";
import { requireOwnerAdminUser } from "@/lib/api/auth-user";
import { downloadPrivacyExportRequest } from "@/lib/privacy/service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireOwnerAdminUser();
    const { id } = await context.params;
    const archive = await downloadPrivacyExportRequest(id);

    return new NextResponse(archive.archive, {
      status: 200,
      headers: {
        "Content-Type": archive.contentType,
        "Content-Disposition": `attachment; filename="${archive.fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Privacy export not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "EXPORT_NOT_READY") {
      return NextResponse.json({ message: "Privacy export is not ready." }, { status: 409 });
    }
    console.error("GET /api/admin/privacy/requests/[id]/download failed", error);
    return NextResponse.json({ message: "Failed to download privacy export." }, { status: 500 });
  }
}
