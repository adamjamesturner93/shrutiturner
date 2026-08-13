import { NextResponse } from "next/server";
import { requireOwnerAdminUser } from "@/lib/api/auth-user";
import { executePrivacyDeletion, previewPrivacyDeletion } from "@/lib/privacy/service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireOwnerAdminUser();
    const { id } = await context.params;
    const preview = await previewPrivacyDeletion(id);
    return NextResponse.json(preview);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/members/[id]/privacy/delete failed", error);
    return NextResponse.json({ message: "Failed to load deletion preview" }, { status: 500 });
  }
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireOwnerAdminUser();
    const { id } = await context.params;
    const request = await executePrivacyDeletion(admin.id, id);
    return NextResponse.json(request);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "PRIVACY_DELETION_BLOCKED") {
      return NextResponse.json(
        { message: "Deletion is blocked by an active dispute hold." },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/members/[id]/privacy/delete failed", error);
    return NextResponse.json({ message: "Failed to execute deletion" }, { status: 500 });
  }
}
