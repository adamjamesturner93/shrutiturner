import { NextResponse } from "next/server";
import { ClassSessionStatus } from "@prisma/client";
import { requireAdminUser } from "@/lib/api/auth-user";
import { getClassSessionDetail, updateClassSession } from "@/lib/classes/session-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireAdminUser();
    const { id } = await context.params;
    const detail = await getClassSessionDetail(id, adminUser.id);
    if (!detail) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/classes/sessions/[id] failed", error);
    return NextResponse.json({ message: "Failed to load session" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const body = (await request.json()) as {
      startsAtUtc?: string;
      endsAtUtc?: string;
      capacity?: number;
      status?: string;
      notes?: string;
      instructorUserId?: string;
      instructorProfileEntryId?: string | null;
    };

    const status =
      typeof body.status === "string" &&
      ["draft", "scheduled", "live", "completed", "cancelled"].includes(body.status)
        ? (body.status as ClassSessionStatus)
        : undefined;

    const updated = await updateClassSession(id, {
      startsAtUtc: body.startsAtUtc ? new Date(body.startsAtUtc) : undefined,
      endsAtUtc: body.endsAtUtc ? new Date(body.endsAtUtc) : undefined,
      capacity: typeof body.capacity === "number" ? body.capacity : undefined,
      status,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      instructorUserId:
        typeof body.instructorUserId === "string" ? body.instructorUserId : undefined,
      instructorProfileEntryId:
        typeof body.instructorProfileEntryId === "string"
          ? body.instructorProfileEntryId
          : body.instructorProfileEntryId === null
            ? null
            : undefined,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (
      error instanceof Error &&
      ["SESSION_NOT_FOUND", "CLASS_DEFINITION_NOT_FOUND", "INSTRUCTOR_NOT_FOUND"].includes(
        error.message
      )
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("PATCH /api/admin/classes/sessions/[id] failed", error);
    return NextResponse.json({ message: "Failed to update session" }, { status: 500 });
  }
}
