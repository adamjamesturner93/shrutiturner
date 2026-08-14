import { connection, NextResponse } from "next/server";
import { CoachingApplicationStatus } from "@prisma/client";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import {
  listAdminCoachingApplications,
  updateAdminCoachingApplication,
} from "@/lib/coaching/service";

type PatchBody = {
  id?: unknown;
  status?: unknown;
  adminNotes?: unknown;
  decisionReason?: unknown;
  convertToClient?: unknown;
  consultationStatus?: unknown;
  consultationScheduledAt?: unknown;
  consultationNotes?: unknown;
  recommendedOfferKey?: unknown;
};

export async function GET(request: Request) {
  await connection();

  try {
    await requireStaffAdminUser();
    const url = new URL(request.url);
    const applications = await listAdminCoachingApplications({
      status: url.searchParams.get("status") || "all",
      tier: url.searchParams.get("tier") || "all",
    });
    return NextResponse.json(applications);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/coaching/applications failed", error);
    return NextResponse.json({ message: "Failed to load coaching enquiries." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const adminUser = await requireStaffAdminUser();
    const body = (await request.json().catch(() => null)) as PatchBody | null;
    if (!body || typeof body.id !== "string") {
      return NextResponse.json({ message: "Enquiry id is required." }, { status: 400 });
    }
    const status =
      typeof body.status === "string" &&
      [
        "submitted",
        "under_review",
        "follow_up_needed",
        "consultation_scheduled",
        "consultation_completed",
        "offer_sent",
        "waitlisted",
        "approved",
        "declined",
        "converted",
        "withdrawn",
      ].includes(body.status)
        ? (body.status as CoachingApplicationStatus)
        : undefined;
    const consultationScheduledAt =
      body.consultationScheduledAt === null
        ? null
        : typeof body.consultationScheduledAt === "string"
          ? body.consultationScheduledAt
          : undefined;
    const updated = await updateAdminCoachingApplication({
      id: body.id,
      status,
      adminNotes: typeof body.adminNotes === "string" ? body.adminNotes : undefined,
      decisionReason: typeof body.decisionReason === "string" ? body.decisionReason : undefined,
      convertToClient: body.convertToClient === true,
      consultationStatus:
        typeof body.consultationStatus === "string" &&
        ["not_scheduled", "scheduled", "completed", "cancelled"].includes(body.consultationStatus)
          ? (body.consultationStatus as "not_scheduled" | "scheduled" | "completed" | "cancelled")
          : undefined,
      consultationScheduledAt,
      consultationNotes:
        typeof body.consultationNotes === "string" ? body.consultationNotes : undefined,
      recommendedOfferKey:
        body.recommendedOfferKey === null ||
        (typeof body.recommendedOfferKey === "string" &&
          ["independent_training_plan", "guided_training_plan", "one_to_one_coaching"].includes(
            body.recommendedOfferKey
          ))
          ? (body.recommendedOfferKey as
              | "independent_training_plan"
              | "guided_training_plan"
              | "one_to_one_coaching"
              | null)
          : undefined,
      actorUserId: adminUser.id,
      requestId: request.headers.get("x-request-id"),
      requestPath: new URL(request.url).pathname,
      requestIp:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip"),
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Enquiry not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "DECISION_REASON_REQUIRED") {
      return NextResponse.json(
        { message: "Add a client-facing reason before declining this enquiry." },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "RECOMMENDED_OFFER_REQUIRED") {
      return NextResponse.json(
        { message: "Choose a recommended coaching tier before sending the offer." },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "CONSULTATION_DATE_REQUIRED") {
      return NextResponse.json(
        { message: "Choose a consultation date before marking it scheduled." },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "INVALID_CONSULTATION_DATE") {
      return NextResponse.json({ message: "Choose a valid consultation date." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "CONSULTATION_REQUIRED") {
      return NextResponse.json(
        { message: "Mark the consultation complete before recommending or starting support." },
        { status: 400 }
      );
    }
    console.error("PATCH /api/admin/coaching/applications failed", error);
    return NextResponse.json({ message: "Failed to update enquiry." }, { status: 500 });
  }
}
