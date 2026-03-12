import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getBillingHistory } from "@/lib/billing/history-service";

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(10, Number(url.searchParams.get("limit") || 50)));
    const rows = await getBillingHistory(user.id, limit);
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/me/billing-history failed", error);
    return NextResponse.json({ message: "Failed to load billing history" }, { status: 500 });
  }
}
