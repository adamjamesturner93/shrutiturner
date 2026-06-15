import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import {
  applyCoachingPackageChangeManually,
  createCoachingPackageChangeRequest,
} from "@/lib/coaching/service";
import { coachingTiers, type CoachingOfferKey } from "@/data/marketing";

type Body = {
  profileId?: unknown;
  toOfferKey?: unknown;
  effectiveMode?: unknown;
  note?: unknown;
  manualApply?: unknown;
};

function parseOfferKey(value: unknown): CoachingOfferKey | null {
  return typeof value === "string" && coachingTiers.some((offer) => offer.id === value)
    ? (value as CoachingOfferKey)
    : null;
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireStaffAdminUser();
    const body = (await request.json().catch(() => null)) as Body | null;
    const toOfferKey = parseOfferKey(body?.toOfferKey);
    const effectiveMode =
      body?.effectiveMode === "immediate" ? "immediate" : ("next_invoice" as const);
    if (!body || typeof body.profileId !== "string" || !toOfferKey) {
      return NextResponse.json({ message: "Invalid coaching package change." }, { status: 400 });
    }

    const common = {
      profileId: body.profileId,
      toOfferKey,
      note: typeof body.note === "string" ? body.note : undefined,
      actorUserId: adminUser.id,
      requestId: request.headers.get("x-request-id"),
      requestPath: new URL(request.url).pathname,
      requestIp:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip"),
    };

    const change =
      body.manualApply === true
        ? await applyCoachingPackageChangeManually(common)
        : await createCoachingPackageChangeRequest({
            ...common,
            effectiveMode,
          });

    return NextResponse.json({
      id: change.id,
      status: change.status,
      toOfferKey: change.toOfferKey,
      effectiveMode: change.effectiveMode,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Coaching profile not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "INVALID_COACHING_OFFER") {
      return NextResponse.json({ message: "Invalid coaching package." }, { status: 400 });
    }
    console.error("POST /api/admin/coaching/package-changes failed", error);
    return NextResponse.json({ message: "Failed to create package change." }, { status: 500 });
  }
}
