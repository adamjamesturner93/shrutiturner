import { BillingDisputeStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireOwnerAdminUser } from "@/lib/api/auth-user";
import { listBillingDisputeCases, updateBillingDisputeCase } from "@/lib/billing/dispute-service";

export async function GET() {
  try {
    await requireOwnerAdminUser();
    const disputes = await listBillingDisputeCases();
    return NextResponse.json(disputes);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/disputes failed", error);
    return NextResponse.json({ message: "Failed to load disputes" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireOwnerAdminUser();
    const body = (await request.json().catch(() => ({}))) as {
      disputeId?: string;
      status?: BillingDisputeStatus;
      reason?: string;
    };
    if (
      typeof body.disputeId !== "string" ||
      !body.status ||
      !Object.values(BillingDisputeStatus).includes(body.status)
    ) {
      return NextResponse.json({ message: "Invalid dispute update." }, { status: 400 });
    }

    const dispute = await updateBillingDisputeCase({
      disputeId: body.disputeId,
      actorUserId: admin.id,
      status: body.status,
      reason: body.reason || null,
    });
    return NextResponse.json(dispute);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("PATCH /api/admin/disputes failed", error);
    return NextResponse.json({ message: "Failed to update dispute" }, { status: 500 });
  }
}
