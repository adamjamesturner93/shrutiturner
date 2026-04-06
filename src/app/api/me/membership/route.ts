import { connection, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { isOwnerAdminRole } from "@/lib/authz/roles";
import {
  ensureInstructorMembership,
  getMembershipState,
  syncMembershipFromStripe,
} from "@/lib/membership/membership-service";

export async function GET() {
  try {
    await connection();
    const user = await requireSessionUser();
    if (isOwnerAdminRole(user.role)) {
      await ensureInstructorMembership(user.id);
    } else {
      await syncMembershipFromStripe(user.id).catch((error) => {
        console.warn("[membership] Stripe sync skipped; serving cached membership state instead", {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
      });
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
