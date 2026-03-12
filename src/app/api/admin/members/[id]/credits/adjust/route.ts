import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { adminAdjustCredits } from "@/lib/admin/members-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const delta = Number(body.delta);
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!Number.isInteger(delta) || delta === 0) {
      return NextResponse.json({ message: "Invalid credit amount." }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ message: "Reason is required." }, { status: 400 });
    }

    const member = await adminAdjustCredits({
      userId: id,
      adminUserId: session.user.id,
      delta,
      reason,
    });

    if (!member) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ message: "Cannot remove more credits than available." }, { status: 400 });
    }
    console.error("POST /api/admin/members/[id]/credits/adjust failed", error);
    return NextResponse.json({ message: "Failed to adjust credits" }, { status: 500 });
  }
}
