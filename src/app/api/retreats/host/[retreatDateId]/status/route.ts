import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getRetreatHostPageState } from "@/lib/retreats/live-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ retreatDateId: string }> }
) {
  try {
    const user = await requireSessionUser();
    const { retreatDateId } = await context.params;
    return NextResponse.json(await getRetreatHostPageState(retreatDateId, user.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { message: "Unable to refresh workshop status." },
      {
        status:
          code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" || code === "NOT_FOUND" ? 403 : 500,
      }
    );
  }
}
