import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { updateCoachingProfileStatus } from "@/lib/coaching/service";

type Body = {
  profileId?: unknown;
  status?: unknown;
};

const validProfileStatuses = new Set(["onboarding", "active", "paused", "completed"]);

export async function PATCH(request: Request) {
  try {
    const adminUser = await requireStaffAdminUser();
    const body = (await request.json().catch(() => null)) as Body | null;
    if (
      !body ||
      typeof body.profileId !== "string" ||
      typeof body.status !== "string" ||
      !validProfileStatuses.has(body.status)
    ) {
      return NextResponse.json({ message: "Invalid coaching profile status." }, { status: 400 });
    }

    const updated = await updateCoachingProfileStatus({
      profileId: body.profileId,
      status: body.status as "onboarding" | "active" | "paused" | "completed",
      actorUserId: adminUser.id,
      requestId: request.headers.get("x-request-id"),
      requestPath: new URL(request.url).pathname,
      requestIp:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip"),
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
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
    console.error("PATCH /api/admin/coaching/profiles/status failed", error);
    return NextResponse.json({ message: "Failed to update coaching status." }, { status: 500 });
  }
}
