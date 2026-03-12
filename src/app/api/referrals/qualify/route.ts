import { NextResponse } from "next/server";
import { qualifyReferral } from "@/lib/referrals/referral-service";

function isAuthorized(request: Request): boolean {
  const expected = process.env.REFERRAL_QUALIFY_SECRET;
  if (!expected) return false;
  const received = request.headers.get("x-referral-qualify-secret") || "";
  return received === expected;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const result = await qualifyReferral({
      eventId: typeof body.eventId === "string" ? body.eventId : undefined,
      referredUserId: typeof body.referredUserId === "string" ? body.referredUserId : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/referrals/qualify failed", error);
    return NextResponse.json({ message: "Failed to qualify referral" }, { status: 500 });
  }
}
