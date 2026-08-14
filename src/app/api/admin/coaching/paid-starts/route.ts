import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { createCoachingPaidStartRequest } from "@/lib/coaching/service";
import { activeCoachingTiers, type CoachingOfferKey } from "@/data/marketing";

type Body = {
  profileId?: unknown;
  toOfferKey?: unknown;
  billingStartsOn?: unknown;
  note?: unknown;
};

function parseOfferKey(value: unknown): CoachingOfferKey | null {
  return typeof value === "string" && activeCoachingTiers.some((offer) => offer.id === value)
    ? (value as CoachingOfferKey)
    : null;
}

function parseBillingStartDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireStaffAdminUser();
    const body = (await request.json().catch(() => null)) as Body | null;
    const toOfferKey = parseOfferKey(body?.toOfferKey);
    const billingStartsAt = parseBillingStartDate(body?.billingStartsOn);
    if (!body || typeof body.profileId !== "string" || !toOfferKey || !billingStartsAt) {
      return NextResponse.json(
        { message: "Choose a paid plan and valid billing start date." },
        { status: 400 }
      );
    }

    const paidStart = await createCoachingPaidStartRequest({
      profileId: body.profileId,
      toOfferKey,
      billingStartsAt,
      note: typeof body.note === "string" ? body.note : undefined,
      actorUserId: adminUser.id,
      requestId: request.headers.get("x-request-id"),
      requestPath: new URL(request.url).pathname,
      requestIp:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip"),
    });

    return NextResponse.json({
      id: paidStart.id,
      status: paidStart.status,
      requestType: paidStart.requestType,
      toOfferKey: paidStart.toOfferKey,
      billingStartsAt: paidStart.billingStartsAt?.toISOString() || null,
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
      return NextResponse.json({ message: "Invalid paid plan." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "COACHING_PAID_START_DATE_INVALID") {
      return NextResponse.json({ message: "Billing cannot start in the past." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "COACHING_PAID_START_NOT_AVAILABLE") {
      return NextResponse.json(
        { message: "This client already has paid coaching billing configured." },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/coaching/paid-starts failed", error);
    return NextResponse.json(
      { message: "Failed to create the paid plan invitation." },
      { status: 500 }
    );
  }
}
