import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { getRetreatLiveRoster } from "@/lib/retreats/live-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireStaffAdminUser();
    const { id } = await context.params;
    return NextResponse.json({
      retreatDateId: id,
      attendance: await getRetreatLiveRoster(id, admin.id),
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "UNAUTHORIZED")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (code === "FORBIDDEN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    return NextResponse.json({ message: "Unable to load attendance." }, { status: 500 });
  }
}
