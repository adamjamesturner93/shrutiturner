import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import {
  createClassTimetableRule,
  generateDraftSessionsForTimetableRule,
  listClassTimetableRules,
} from "@/lib/classes/timetable-service";

export async function GET() {
  try {
    await requireStaffAdminUser();
    const rows = await listClassTimetableRules();
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    console.error("GET /api/admin/classes/timetables failed", error);
    return NextResponse.json({ message: "Failed to load class timetables" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireStaffAdminUser();
    const body = (await request.json()) as {
      classDefinitionSlug?: string;
      weekday?: number;
      startsAtLocal?: string;
      durationMinutes?: number;
      timezone?: string;
      defaultCapacity?: number;
      instructorUserId?: string;
      instructorProfileEntryId?: string;
      startsOn?: string;
      endsOn?: string;
      active?: boolean;
      notes?: string;
      exclusionDates?: string[];
    };

    if (
      !body.classDefinitionSlug ||
      typeof body.weekday !== "number" ||
      !body.startsAtLocal ||
      typeof body.durationMinutes !== "number" ||
      typeof body.defaultCapacity !== "number" ||
      !body.startsOn
    ) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const created = await createClassTimetableRule(
      {
        classDefinitionSlug: body.classDefinitionSlug,
        weekday: body.weekday,
        startsAtLocal: body.startsAtLocal,
        durationMinutes: body.durationMinutes,
        timezone: body.timezone,
        defaultCapacity: body.defaultCapacity,
        instructorUserId: body.instructorUserId || adminUser.id,
        instructorProfileEntryId: body.instructorProfileEntryId,
        startsOn: body.startsOn,
        endsOn: body.endsOn,
        active: body.active,
        notes: body.notes,
        exclusionDates: Array.isArray(body.exclusionDates) ? body.exclusionDates : [],
      },
      adminUser.id
    );

    const draftResult = await generateDraftSessionsForTimetableRule(created.id, {
      fromDate: new Date(`${body.startsOn}T00:00:00.000Z`),
      actorUserId: adminUser.id,
    });

    return NextResponse.json(
      {
        id: created.id,
        draftCreatedCount: draftResult.createdCount,
        draftSkippedExistingCount: draftResult.skippedExistingCount,
      },
      { status: 201 }
    );
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
        "INVALID_WEEKDAY",
        "INVALID_START_TIME",
        "INVALID_DATE_RANGE",
        "CLASS_DEFINITION_NOT_FOUND",
        "INSTRUCTOR_NOT_FOUND",
      ].includes(error.message)
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("POST /api/admin/classes/timetables failed", error);
    return NextResponse.json({ message: "Failed to create class timetable" }, { status: 500 });
  }
}
