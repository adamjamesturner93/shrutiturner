import { connection, NextResponse } from "next/server";
import { CoachingApplicationStatus } from "@prisma/client";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import {
  listAdminCoachingApplications,
  updateAdminCoachingApplication,
} from "@/lib/coaching/service";

type PatchBody = {
  id?: unknown;
  status?: unknown;
  adminNotes?: unknown;
  convertToClient?: unknown;
};

export async function GET(request: Request) {
  try {
    await connection();
    await requireStaffAdminUser();
    const url = new URL(request.url);
    const applications = await listAdminCoachingApplications({
      status: url.searchParams.get("status") || "all",
      tier: url.searchParams.get("tier") || "all",
    });
    return NextResponse.json(applications);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/coaching/applications failed", error);
    return NextResponse.json({ message: "Failed to load coaching applications." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const adminUser = await requireStaffAdminUser();
    const body = (await request.json().catch(() => null)) as PatchBody | null;
    if (!body || typeof body.id !== "string") {
      return NextResponse.json({ message: "Application id is required." }, { status: 400 });
    }
    const status =
      typeof body.status === "string" &&
      [
        "submitted",
        "under_review",
        "follow_up_needed",
        "approved",
        "declined",
        "converted",
      ].includes(body.status)
        ? (body.status as CoachingApplicationStatus)
        : undefined;
    const updated = await updateAdminCoachingApplication({
      id: body.id,
      status,
      adminNotes: typeof body.adminNotes === "string" ? body.adminNotes : undefined,
      convertToClient: body.convertToClient === true,
      actorUserId: adminUser.id,
      requestId: request.headers.get("x-request-id"),
      requestPath: new URL(request.url).pathname,
      requestIp:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip"),
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Application not found." }, { status: 404 });
    }
    console.error("PATCH /api/admin/coaching/applications failed", error);
    return NextResponse.json({ message: "Failed to update application." }, { status: 500 });
  }
}
