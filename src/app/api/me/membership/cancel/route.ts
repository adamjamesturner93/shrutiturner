import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { cancelMembership } from "@/lib/membership/membership-service";

export async function POST() {
  try {
    const user = await requireSessionUser();
    const membership = await cancelMembership(user.id);
    return NextResponse.json({ membership });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/me/membership/cancel failed", error);
    return NextResponse.json({ message: "Failed to cancel membership" }, { status: 500 });
  }
}
