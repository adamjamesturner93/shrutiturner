import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { startOrSwitchMembership } from "@/lib/membership/membership-service";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json().catch(() => ({}))) as {
      plan?: string;
      billingInterval?: string;
    };
    const plan = body.plan;
    const billingInterval = body.billingInterval === "annual" ? "annual" : "monthly";

    if (plan !== "movewell") {
      return NextResponse.json({ message: "Invalid plan." }, { status: 400 });
    }

    const membership = await startOrSwitchMembership({ userId: user.id, plan, billingInterval });
    return NextResponse.json({ membership });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/me/membership/change-plan failed", error);
    return NextResponse.json({ message: "Failed to change plan" }, { status: 500 });
  }
}
