import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { cancelClassSessionsForWeek } from "@/lib/classes/booking-service";

export async function POST(request: Request) {
  try {
    const adminUser = await requireStaffAdminUser();
    const body = (await request.json().catch(() => ({}))) as {
      weekStart?: string;
      reason?: string;
    };

    if (!body.weekStart || Number.isNaN(Date.parse(`${body.weekStart}T00:00:00.000Z`))) {
      return NextResponse.json(
        { message: "A valid week start date is required." },
        { status: 400 }
      );
    }

    const result = await cancelClassSessionsForWeek({
      weekStart: body.weekStart,
      cancelledByUserId: adminUser.id,
      reason: typeof body.reason === "string" ? body.reason : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("POST /api/admin/classes/sessions/cancel-week failed", error);
    return NextResponse.json({ message: "Failed to cancel this week of classes" }, { status: 500 });
  }
}
