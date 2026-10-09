import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getRetreatLiveLandingState } from "@/lib/retreats/live-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    return NextResponse.json(await getRetreatLiveLandingState(id, user.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { message: "Unable to refresh workshop access." },
      {
        status:
          code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" || code === "NOT_FOUND" ? 403 : 500,
      }
    );
  }
}
