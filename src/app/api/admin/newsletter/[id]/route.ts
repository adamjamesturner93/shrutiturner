import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { getAdminNewsletterCampaign } from "@/lib/admin/newsletter-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffAdminUser();
    const { id } = await params;
    const campaign = await getAdminNewsletterCampaign(id);
    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }
    return NextResponse.json(campaign);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/newsletter/[id] failed", error);
    return NextResponse.json({ message: "Failed to load campaign" }, { status: 500 });
  }
}
