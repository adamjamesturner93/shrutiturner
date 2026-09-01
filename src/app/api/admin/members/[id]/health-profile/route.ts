import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { getAdminMemberDetail } from "@/lib/admin/members-service";
import { upsertHealthProfile } from "@/lib/health/health-service";
import { isAcceptanceRequiredError } from "@/lib/legal/acceptance-service";

const ADMIN_HEALTH_SOURCES = new Set([
  "coaching_enquiry",
  "consultation",
  "member_message",
  "other",
]);

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ message: "Invalid request body." }, { status: 400 });

    const source = typeof body.source === "string" ? body.source : "";
    if (!ADMIN_HEALTH_SOURCES.has(source)) {
      return NextResponse.json(
        { message: "Choose where this health information was provided." },
        { status: 400 }
      );
    }

    const previous = await getAdminMemberDetail(id);
    if (!previous) return NextResponse.json({ message: "Member not found." }, { status: 404 });

    await upsertHealthProfile(
      id,
      {
        declarationStatus:
          body.declarationStatus === "none_declared" ||
          body.declarationStatus === "context_declared"
            ? body.declarationStatus
            : undefined,
        conditions:
          body.conditions && typeof body.conditions === "object"
            ? (body.conditions as Record<string, boolean>)
            : undefined,
        details:
          body.details && typeof body.details === "object"
            ? (body.details as Record<string, string>)
            : undefined,
        tracksFlareCheckIns:
          typeof body.tracksFlareCheckIns === "boolean" ? body.tracksFlareCheckIns : undefined,
        additionalNotes:
          typeof body.additionalNotes === "string" ? body.additionalNotes : undefined,
      },
      adminUser.id,
      {
        actor: "admin",
        source: source as "coaching_enquiry" | "consultation" | "member_message" | "other",
        sourceNote: typeof body.sourceNote === "string" ? body.sourceNote : undefined,
      }
    );

    const member = await getAdminMemberDetail(id);
    await createAdminActionLog({
      actorUserId: adminUser.id,
      actionType: "member_health_profile_updated",
      targetType: "user",
      targetId: id,
      requestId: request.headers.get("x-request-id"),
      requestPath: new URL(request.url).pathname,
      requestIp:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip"),
      oldValueJson: previous.healthProfile
        ? {
            declarationStatus: previous.healthProfile.declarationStatus,
            conditions: previous.healthProfile.conditions,
            details: previous.healthProfile.details,
            additionalNotes: previous.healthProfile.additionalNotes,
          }
        : null,
      newValueJson: member?.healthProfile
        ? {
            declarationStatus: member.healthProfile.declarationStatus,
            conditions: member.healthProfile.conditions,
            details: member.healthProfile.details,
            additionalNotes: member.healthProfile.additionalNotes,
            source,
          }
        : null,
    });

    revalidatePath(`/admin/members/${id}`);
    revalidatePath("/dashboard/health");
    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (isAcceptanceRequiredError(error)) {
      return NextResponse.json(
        {
          message:
            "The member must accept the current Health Data Consent before Shruti can save health information.",
          details: error.details,
        },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "INVALID_HEALTH_PROFILE") {
      return NextResponse.json(
        { message: "Choose a declaration option or add relevant health context." },
        { status: 400 }
      );
    }
    console.error("PUT /api/admin/members/[id]/health-profile failed", error);
    return NextResponse.json({ message: "Failed to update health profile." }, { status: 500 });
  }
}
