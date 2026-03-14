import { connection, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import {
  ensureInstructorMembership,
  getMembershipState,
  syncMembershipFromStripe,
} from "@/lib/membership/membership-service";

export async function GET() {
  try {
    await connection();
    const user = await requireSessionUser();
    if (user.role === "admin") {
      await ensureInstructorMembership(user.id);
    } else {
      await syncMembershipFromStripe(user.id);
    }
    const state = await getMembershipState(user.id);
    return NextResponse.json(state);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/me/membership failed", error);
    return NextResponse.json({ message: "Failed to load membership state" }, { status: 500 });
  }
}
