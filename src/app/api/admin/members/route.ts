import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { listAdminMembers } from "@/lib/admin/members-service";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);
    const data = await listAdminMembers({
      search: url.searchParams.get("search") || undefined,
      status: url.searchParams.get("status") || undefined,
      plan: url.searchParams.get("plan") || undefined,
      role: url.searchParams.get("role") || undefined,
      risk: url.searchParams.get("risk") || undefined,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/members failed", error);
    return NextResponse.json({ message: "Failed to load members" }, { status: 500 });
  }
}
