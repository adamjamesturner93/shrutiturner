import { NextResponse } from "next/server";
import { MembershipStatus } from "@prisma/client";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { getAdminMemberDetail, updateAdminMember } from "@/lib/admin/members-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffAdminUser();
    const { id } = await context.params;
    const member = await getAdminMemberDetail(id);
    if (!member) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }
    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/members/[id] failed", error);
    return NextResponse.json({ message: "Failed to load member" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const statusRaw = typeof body.status === "string" ? body.status : undefined;
    const status =
      statusRaw && ["active", "paused", "cancelled", "expired", "past_due"].includes(statusRaw)
        ? (statusRaw as MembershipStatus)
        : undefined;

    const member = await updateAdminMember(
      id,
      {
        isInstructor: typeof body.isInstructor === "boolean" ? body.isInstructor : undefined,
        instructorProfileEntryId:
          typeof body.instructorProfileEntryId === "string"
            ? body.instructorProfileEntryId
            : body.instructorProfileEntryId === null
              ? null
              : undefined,
        isCoachingClient:
          typeof body.isCoachingClient === "boolean" ? body.isCoachingClient : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
        status,
      },
      {
        actorUserId: adminUser.id,
        requestId: request.headers.get("x-request-id"),
        requestPath: new URL(request.url).pathname,
        requestIp:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip"),
      }
    );

    if (!member) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("PATCH /api/admin/members/[id] failed", error);
    return NextResponse.json({ message: "Failed to update member" }, { status: 500 });
  }
}
