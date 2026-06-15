import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { rescheduleClassSessionsForWeek } from "@/lib/classes/session-service";

export async function POST(request: Request) {
  try {
    const adminUser = await requireStaffAdminUser();
    const body = (await request.json().catch(() => ({}))) as {
      weekStart?: string;
      dayDelta?: number;
    };

    if (!body.weekStart || Number.isNaN(Date.parse(`${body.weekStart}T00:00:00.000Z`))) {
      return NextResponse.json(
        { message: "A valid week start date is required." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(body.dayDelta) || body.dayDelta === 0 || Math.abs(body.dayDelta) > 14) {
      return NextResponse.json(
        { message: "Choose a whole-day shift between -14 and 14, excluding 0." },
        { status: 400 }
      );
    }

    const result = await rescheduleClassSessionsForWeek({
      weekStart: body.weekStart,
      dayDelta: body.dayDelta,
      adminUserId: adminUser.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (
      error instanceof Error &&
      (error.message === "INVALID_WEEK_START" || error.message === "INVALID_DAY_DELTA")
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("POST /api/admin/classes/sessions/reschedule-week failed", error);
    return NextResponse.json(
      { message: "Failed to reschedule this week of classes" },
      { status: 500 }
    );
  }
}
