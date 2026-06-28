import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, reason: "REFERRALS_RETIRED", message: "Referral rewards are retired." },
    { status: 410 }
  );
}
