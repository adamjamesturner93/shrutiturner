import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import {
  getClassOperationalSettings,
  updateClassOperationalSettings,
} from "@/lib/classes/settings-service";

export async function GET() {
  try {
    await requireStaffAdminUser();
    const settings = await getClassOperationalSettings();
    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/business/class-rules failed", error);
    return NextResponse.json({ message: "Failed to load class rules" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireStaffAdminUser();
    const body = (await request.json().catch(() => ({}))) as {
      preJoinWindowMinutes?: number;
      lateJoinCutoffMinutes?: number;
      creditRefundWindowMinutes?: number;
      emptyClassAutoCancelWindowMinutes?: number;
    };

    const settings = await updateClassOperationalSettings({
      preJoinWindowMinutes:
        typeof body.preJoinWindowMinutes === "number" ? body.preJoinWindowMinutes : undefined,
      lateJoinCutoffMinutes:
        typeof body.lateJoinCutoffMinutes === "number" ? body.lateJoinCutoffMinutes : undefined,
      creditRefundWindowMinutes:
        typeof body.creditRefundWindowMinutes === "number"
          ? body.creditRefundWindowMinutes
          : undefined,
      emptyClassAutoCancelWindowMinutes:
        typeof body.emptyClassAutoCancelWindowMinutes === "number"
          ? body.emptyClassAutoCancelWindowMinutes
          : undefined,
    });

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("PATCH /api/admin/business/class-rules failed", error);
    return NextResponse.json({ message: "Failed to update class rules" }, { status: 500 });
  }
}
