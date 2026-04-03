import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { publishActiveClassTimetablesForWeek } from "@/lib/classes/timetable-service";

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as {
      weekStart?: string;
    };

    if (!body.weekStart) {
      return NextResponse.json({ message: "Week start is required" }, { status: 400 });
    }

    const result = await publishActiveClassTimetablesForWeek({
      weekStart: body.weekStart,
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
      [
        "INVALID_WEEK_START",
        "PUBLISH_WEEK_IN_PAST",
        "PUBLISH_WEEK_OUT_OF_RANGE",
      ].includes(error.message)
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("POST /api/admin/classes/timetables/publish-week failed", error);
    return NextResponse.json({ message: "Failed to publish this week" }, { status: 500 });
  }
}
