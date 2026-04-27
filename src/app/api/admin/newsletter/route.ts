import { connection, NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { getAdminNewsletterSummary } from "@/lib/admin/newsletter-service";

export async function GET(request: Request) {
  try {
    await connection();
    await requireStaffAdminUser();
    const url = new URL(request.url);
    const summary = await getAdminNewsletterSummary({
      campaignStatus: url.searchParams.get("campaignStatus") || undefined,
      campaignDateRange: url.searchParams.get("campaignDateRange") || undefined,
      campaignPage: Number(url.searchParams.get("campaignPage") || "1"),
      campaignPageSize: Number(url.searchParams.get("campaignPageSize") || "10"),
      audienceDateRange: url.searchParams.get("audienceDateRange") || undefined,
      audienceSource: url.searchParams.get("audienceSource") || undefined,
      audienceStart: url.searchParams.get("audienceStart") || undefined,
      audienceEnd: url.searchParams.get("audienceEnd") || undefined,
    });
    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/newsletter failed", error);
    return NextResponse.json({ message: "Failed to load newsletter summary" }, { status: 500 });
  }
}
