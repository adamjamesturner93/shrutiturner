import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { retryContentfulCampaign } from "@/lib/newsletter/campaign-automation";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const result = await retryContentfulCampaign(id);
    return NextResponse.json(result);
  } catch (error) {
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
    console.error("POST /api/admin/newsletter/campaigns/[id]/retry failed", error);
    return NextResponse.json({ message: "Failed to retry campaign" }, { status: 500 });
  }
}
