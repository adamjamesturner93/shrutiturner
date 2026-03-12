import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { listAdminSubscribers, type SubscriptionType } from "@/lib/admin/newsletter-service";

const validTypes = new Set(["all", "newsletter", "blog", "both", "neither"]);

export async function GET(req: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(req.url);
    const rawType = searchParams.get("type") || "all";
    const type = validTypes.has(rawType) ? (rawType as SubscriptionType | "all") : "all";
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "25", 10);
    const search = searchParams.get("search") || undefined;
    const payload = await listAdminSubscribers({ type, page, pageSize, search });
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/newsletter/subscribers failed", error);
    return NextResponse.json({ message: "Failed to load subscribers." }, { status: 500 });
  }
}
