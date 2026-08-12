import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getRetreatLiveRoster } from "@/lib/retreats/live-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ retreatDateId: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { retreatDateId } = await context.params;
    return NextResponse.json(await getRetreatLiveRoster(retreatDateId, user.id));
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { message: code === "FORBIDDEN" ? "Forbidden" : "Unable to load attendance." },
      { status: code === "FORBIDDEN" ? 403 : 500 }
    );
  }
}
