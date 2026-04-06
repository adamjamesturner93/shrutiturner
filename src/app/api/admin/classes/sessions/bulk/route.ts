import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { bulkCreateClassSessions } from "@/lib/classes/session-service";

export async function POST(request: Request) {
  try {
    const adminUser = await requireStaffAdminUser();
    const body = (await request.json()) as {
      classDefinitionSlug?: string;
      startDate?: string;
      timeLocal?: string;
      durationMinutes?: number;
      capacity?: number;
      repeatWeeks?: number;
      weekdays?: number[];
      instructorUserId?: string;
      instructorProfileEntryId?: string;
      notes?: string;
    };

    if (!body.classDefinitionSlug || !body.startDate || !body.timeLocal) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const result = await bulkCreateClassSessions(
      {
        classDefinitionSlug: body.classDefinitionSlug,
        startDate: body.startDate,
        timeLocal: body.timeLocal,
        durationMinutes: Number(body.durationMinutes || 60),
        capacity: Number(body.capacity || 10),
        repeatWeeks: Number(body.repeatWeeks || 1),
        weekdays: Array.isArray(body.weekdays) ? body.weekdays : [],
        instructorUserId:
          typeof body.instructorUserId === "string" ? body.instructorUserId : undefined,
        instructorProfileEntryId:
          typeof body.instructorProfileEntryId === "string"
            ? body.instructorProfileEntryId
            : undefined,
        notes: typeof body.notes === "string" ? body.notes : "",
      },
      adminUser.id
    );

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
      ["CLASS_DEFINITION_NOT_FOUND", "INVALID_REPEAT_WEEKS", "DAILY_NOT_CONFIGURED"].includes(
        error.message
      )
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("POST /api/admin/classes/sessions/bulk failed", error);
    return NextResponse.json({ message: "Failed to create sessions" }, { status: 500 });
  }
}
