import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { endClassTimetableRule } from "@/lib/classes/timetable-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      mode?: "immediate" | "last-class-date";
      lastClassDate?: string;
      reason?: string;
    };

    if (body.mode !== "immediate" && body.mode !== "last-class-date") {
      return NextResponse.json({ message: "Invalid end mode" }, { status: 400 });
    }

    if (body.mode === "last-class-date" && !body.lastClassDate) {
      return NextResponse.json({ message: "Last class date is required" }, { status: 400 });
    }

    const result = await endClassTimetableRule({
      timetableRuleId: id,
      endedByUserId: adminUser.id,
      mode: body.mode,
      lastClassDate: body.lastClassDate,
      reason: body.reason,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "TIMETABLE_NOT_FOUND") {
      return NextResponse.json({ message: "Timetable not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "INVALID_LAST_CLASS_DATE") {
      return NextResponse.json({ message: "Invalid last class date" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "INVALID_DATE_RANGE") {
      return NextResponse.json(
        { message: "Last class date cannot be before the timetable start date" },
        { status: 400 }
      );
    }

    console.error("POST /api/admin/classes/timetables/[id]/end failed", error);
    return NextResponse.json({ message: "Failed to end class timetable" }, { status: 500 });
  }
}
