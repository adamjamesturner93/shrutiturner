import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { resumeMembershipCancellation } from "@/lib/membership/membership-service";

export async function POST() {
  try {
    const user = await requireSessionUser();
    const membership = await resumeMembershipCancellation(user.id);
    return NextResponse.json({ membership });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "MEMBERSHIP_NOT_FOUND") {
        return NextResponse.json({ message: "Membership not found." }, { status: 404 });
      }
      if (error.message === "STRIPE_NOT_CONFIGURED") {
        return NextResponse.json({ message: "Stripe is not configured." }, { status: 501 });
      }
    }
    console.error("POST /api/me/membership/resume failed", error);
    return NextResponse.json({ message: "Failed to resume membership" }, { status: 500 });
  }
}
