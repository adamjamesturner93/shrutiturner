import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { publishActiveClassTimetables } from "@/lib/classes/timetable-service";

export async function POST() {
  try {
    await requireStaffAdminUser();
    const results = await publishActiveClassTimetables();
    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    console.error("POST /api/admin/classes/timetables/publish-all failed", error);
    return NextResponse.json({ message: "Failed to publish class timetables" }, { status: 500 });
  }
}
