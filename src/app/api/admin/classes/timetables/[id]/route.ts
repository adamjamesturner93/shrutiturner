import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import {
  deleteClassTimetableRule,
  updateClassTimetableRule,
} from "@/lib/classes/timetable-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffAdminUser();
    const { id } = await context.params;
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

    await updateClassTimetableRule(id, {
      classDefinitionSlug: body.classDefinitionSlug,
      weekday: body.weekday,
      startsAtLocal: body.startsAtLocal,
      durationMinutes: body.durationMinutes,
      timezone: body.timezone,
      defaultCapacity: body.defaultCapacity,
      instructorUserId: body.instructorUserId,
      instructorProfileEntryId: body.instructorProfileEntryId,
      startsOn: body.startsOn,
      endsOn: body.endsOn,
      active: body.active,
      notes: body.notes,
      exclusionDates: Array.isArray(body.exclusionDates) ? body.exclusionDates : undefined,
    });

    return NextResponse.json({ ok: true });
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

    console.error("PATCH /api/admin/classes/timetables/[id] failed", error);
    return NextResponse.json({ message: "Failed to update class timetable" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffAdminUser();
    const { id } = await context.params;
    await deleteClassTimetableRule(id);
    return NextResponse.json({ ok: true });
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

    console.error("DELETE /api/admin/classes/timetables/[id] failed", error);
    return NextResponse.json({ message: "Failed to delete class timetable" }, { status: 500 });
  }
}
