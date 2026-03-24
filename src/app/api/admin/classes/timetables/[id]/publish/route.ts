import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { publishClassTimetableRule } from "@/lib/classes/timetable-service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const result = await publishClassTimetableRule(id);
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
    if (
      error instanceof Error &&
      ["CLASS_DEFINITION_NOT_FOUND", "INSTRUCTOR_NOT_FOUND"].includes(error.message)
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("POST /api/admin/classes/timetables/[id]/publish failed", error);
    return NextResponse.json({ message: "Failed to publish class timetable" }, { status: 500 });
  }
}
