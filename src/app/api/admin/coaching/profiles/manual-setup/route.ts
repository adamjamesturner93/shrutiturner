import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { updateCoachingProfileManualSetupStatus } from "@/lib/coaching/service";

type Body = {
  profileId?: unknown;
  everfitConnectionStatus?: unknown;
};

const validManualSetupStatuses = new Set(["not_started", "invite_sent", "connected", "sync_issue"]);

export async function PATCH(request: Request) {
  try {
    const adminUser = await requireStaffAdminUser();
    const body = (await request.json().catch(() => null)) as Body | null;
    if (
      !body ||
      typeof body.profileId !== "string" ||
      typeof body.everfitConnectionStatus !== "string" ||
      !validManualSetupStatuses.has(body.everfitConnectionStatus)
    ) {
      return NextResponse.json({ message: "Invalid manual setup status." }, { status: 400 });
    }

    const updated = await updateCoachingProfileManualSetupStatus({
      profileId: body.profileId,
      everfitConnectionStatus: body.everfitConnectionStatus as
        | "not_started"
        | "invite_sent"
        | "connected"
        | "sync_issue",
      actorUserId: adminUser.id,
      requestId: request.headers.get("x-request-id"),
      requestPath: new URL(request.url).pathname,
      requestIp:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip"),
    });

    return NextResponse.json({
      id: updated.id,
      everfitConnectionStatus: updated.everfitConnectionStatus,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Coaching profile not found." }, { status: 404 });
    }
    console.error("PATCH /api/admin/coaching/profiles/manual-setup failed", error);
    return NextResponse.json({ message: "Failed to update manual setup status." }, { status: 500 });
  }
}
