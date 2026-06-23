import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { getAdminRetreatDetail, setUpRetreatOnlineRoom } from "@/lib/retreats/service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffAdminUser();
    const { id } = await context.params;
    await setUpRetreatOnlineRoom(id);
    const detail = await getAdminRetreatDetail(id);

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Retreat not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "NOT_ONLINE_RETREAT") {
      return NextResponse.json(
        { message: "Online room setup is only available for online retreats." },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "DAILY_NOT_CONFIGURED") {
      return NextResponse.json({ message: "Daily is not configured." }, { status: 409 });
    }

    console.error("POST /api/admin/retreats/[id]/online-room failed", error);
    return NextResponse.json({ message: "Failed to set up online room." }, { status: 500 });
  }
}
