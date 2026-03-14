import { connection, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getHealthProfile, upsertHealthProfile } from "@/lib/health/health-service";

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
        conditions:
          body.conditions && typeof body.conditions === "object"
            ? (body.conditions as Record<string, boolean>)
            : undefined,
        details:
          body.details && typeof body.details === "object"
            ? (body.details as Record<string, string>)
            : undefined,
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
    console.error("PUT /api/me/health-profile failed", error);
    return NextResponse.json({ message: "Failed to save health profile" }, { status: 500 });
  }
}
