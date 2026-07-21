import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { sendRetreatBalanceDueEmails } from "@/lib/retreats/service";

type BalanceEmailBody = {
  mode?: unknown;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as BalanceEmailBody;
    const mode = body.mode === "chaser" ? "chaser" : "due";
    const result = await sendRetreatBalanceDueEmails({
      retreatDateId: id,
      mode,
      actorUserId: adminUser.id,
    });
    return NextResponse.json(result);
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
    console.error("POST /api/admin/retreats/[id]/balance-emails failed", error);
    return NextResponse.json({ message: "Failed to send balance emails." }, { status: 500 });
  }
}
