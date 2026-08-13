import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { sendAdminMemberMessage } from "@/lib/admin/member-email-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!subject) {
      return NextResponse.json({ message: "Subject is required." }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ message: "Message is required." }, { status: 400 });
    }

    await sendAdminMemberMessage({
      memberId: id,
      adminUserId: adminUser.id,
      subject,
      body: message,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "MEMBER_NOT_FOUND") {
      return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }

    console.error("POST /api/admin/members/[id]/email failed", error);
    return NextResponse.json({ message: "Failed to send email." }, { status: 500 });
  }
}
