import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { claimReferralCode } from "@/lib/referrals/referral-service";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const code = typeof body.code === "string" ? body.code : "";

    const result = await claimReferralCode(user.id, code);
    if (!result.ok) {
      const status =
        result.reason === "CODE_NOT_FOUND" || result.reason === "INVALID_CODE"
          ? 400
          : result.reason === "SELF_REFERRAL"
            ? 400
            : result.reason === "ALREADY_CLAIMED_DIFFERENT_REFERRER"
              ? 409
              : 400;
      return NextResponse.json({ ok: false, reason: result.reason }, { status });
    }

    return NextResponse.json({ ok: true, eventId: result.eventId, giftGranted: result.giftGranted });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/referrals/claim failed", error);
    return NextResponse.json({ message: "Failed to claim referral" }, { status: 500 });
  }
}
