import { AcceptanceType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { recordAcceptanceEvent } from "@/lib/legal/acceptance-service";

const SELF_SERVICE_ACCEPTANCE_TYPES = new Set<AcceptanceType>([
  AcceptanceType.terms,
  AcceptanceType.health_waiver,
  AcceptanceType.health_data,
  AcceptanceType.recording_notice,
  AcceptanceType.marketing,
]);

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json().catch(() => ({}))) as {
      type?: string;
      surface?: string;
      metadataJson?: Record<string, unknown>;
    };

    if (
      typeof body.type !== "string" ||
      !SELF_SERVICE_ACCEPTANCE_TYPES.has(body.type as AcceptanceType)
    ) {
      return NextResponse.json({ message: "Invalid acceptance type." }, { status: 400 });
    }

    if (typeof body.surface !== "string" || body.surface.trim().length === 0) {
      return NextResponse.json({ message: "Acceptance surface is required." }, { status: 400 });
    }

    const event = await recordAcceptanceEvent({
      userId: user.id,
      actorUserId: user.id,
      type: body.type as AcceptanceType,
      surface: body.surface.trim(),
      metadataJson:
        body.metadataJson && typeof body.metadataJson === "object"
          ? (body.metadataJson as Prisma.InputJsonValue)
          : undefined,
    });

    return NextResponse.json({
      id: event.id,
      type: event.type,
      version: event.version,
      acceptedAt: event.acceptedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/me/acceptances failed", error);
    return NextResponse.json({ message: "Failed to record acceptance" }, { status: 500 });
  }
}
