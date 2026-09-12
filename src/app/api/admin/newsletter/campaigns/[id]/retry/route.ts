import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { retryContentfulCampaign } from "@/lib/newsletter/campaign-automation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireStaffAdminUser();
    const { id } = await context.params;
    const result = await retryContentfulCampaign({
      campaignId: id,
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
    if (error instanceof Error && error.message === "CAMPAIGN_AUDIENCE_REQUIRES_REVIEW") {
      return NextResponse.json({ message: "This older campaign has no frozen audience. Review it before recovery; the audience will not be rebuilt automatically." }, { status: 409 });
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
    if (error instanceof Error && error.message === "CAMPAIGN_NOT_RETRYABLE") {
      return NextResponse.json({ message: "Campaign cannot be retried" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "CAMPAIGN_RECONCILIATION_REQUIRED") {
      return NextResponse.json(
        {
          message:
            "Campaign has deliveries with an unknown provider outcome and must be reconciled before retrying.",
        },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/newsletter/campaigns/[id]/retry failed", error);
    return NextResponse.json({ message: "Failed to retry campaign" }, { status: 500 });
  }
}
