import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { reconcileContentfulCampaign } from "@/lib/newsletter/campaign-automation";

type ReconciliationBody = {
  resolution?: "confirm_delivered" | "confirm_not_sent";
  deliveries?: Array<{ id: string; attemptCount: number }>;
  note?: string;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json()) as ReconciliationBody;
    if (!Array.isArray(body.deliveries) || !body.deliveries.length || body.deliveries.length > 300 ||
      body.deliveries.some((row) => !row || typeof row.id !== "string" || !Number.isInteger(row.attemptCount) || row.attemptCount < 0) ||
      typeof body.note !== "string" || !body.note.trim() || body.note.length > 2000) {
      return NextResponse.json({ message: "Select reviewed recipients and provide provider evidence (up to 2000 characters)." }, { status: 400 });
    }
    if (body.resolution !== "confirm_delivered" && body.resolution !== "confirm_not_sent") {
      return NextResponse.json(
        { message: "Choose a valid reconciliation outcome" },
        { status: 400 }
      );
    }
    const result = await reconcileContentfulCampaign({
      campaignId: id,
      resolution: body.resolution,
      deliveries: body.deliveries,
      note: body.note,
      actorUserId: adminUser.id,
      requestId: request.headers.get("x-request-id"),
      requestPath: new URL(request.url).pathname,
      requestIp:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip"),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "CAMPAIGN_BUSY") {
      return NextResponse.json({ message: "A campaign operation is still active. Refresh before trying again." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "CAMPAIGN_NOT_FOUND") {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "CAMPAIGN_RECONCILIATION_NOT_REQUIRED") {
      return NextResponse.json(
        { message: "Campaign no longer needs reconciliation" },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/newsletter/campaigns/[id]/reconcile failed", error);
    return NextResponse.json({ message: "Failed to reconcile campaign" }, { status: 500 });
  }
}
