import { connection, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import {
  confirmHealthProfile,
  getHealthProfile,
  upsertHealthProfile,
} from "@/lib/health/health-service";
import { isAcceptanceRequiredError } from "@/lib/legal/acceptance-service";

export async function GET() {
  try {
    await connection();
    const user = await requireSessionUser();
    const profile = await getHealthProfile(user.id);
    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/me/health-profile failed", error);
    return NextResponse.json({ message: "Failed to load health profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const profile = await upsertHealthProfile(
      user.id,
      {
        declarationStatus:
          body.declarationStatus === "incomplete" ||
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
      user.id
    );

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "INVALID_HEALTH_PROFILE") {
      return NextResponse.json(
        { message: "Choose a declaration option or add relevant health context." },
        { status: 400 }
      );
    }
    if (isAcceptanceRequiredError(error)) {
      return NextResponse.json(error.details, { status: 409 });
    }
    console.error("PUT /api/me/health-profile failed", error);
    return NextResponse.json({ message: "Failed to save health profile" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await requireSessionUser();
    const profile = await confirmHealthProfile(user.id, user.id);
    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "HEALTH_PROFILE_NOT_FOUND") {
      return NextResponse.json({ message: "Health profile not found" }, { status: 404 });
    }
    if (isAcceptanceRequiredError(error)) {
      return NextResponse.json(error.details, { status: 409 });
    }
    console.error("POST /api/me/health-profile failed", error);
    return NextResponse.json({ message: "Failed to confirm health profile" }, { status: 500 });
  }
}
