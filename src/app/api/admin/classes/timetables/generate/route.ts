import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { generateDraftSessionsForActiveClassTimetables } from "@/lib/classes/timetable-service";

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as {
      generateUntil?: string;
    };

    if (!body.generateUntil) {
      return NextResponse.json({ message: "Generate-until date is required" }, { status: 400 });
    }

    const result = await generateDraftSessionsForActiveClassTimetables({
      generateUntil: body.generateUntil,
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
        "INVALID_GENERATE_UNTIL",
        "GENERATE_UNTIL_IN_PAST",
        "GENERATE_UNTIL_EXCEEDS_PLANNING_WINDOW",
      ].includes(error.message)
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("POST /api/admin/classes/timetables/generate failed", error);
    return NextResponse.json({ message: "Failed to generate draft sessions" }, { status: 500 });
  }
}
