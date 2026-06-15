import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { setPromotionCodeActive } from "@/lib/billing/catalog-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { active?: boolean };
    if (typeof body.active !== "boolean") {
      return NextResponse.json({ message: "active boolean is required" }, { status: 400 });
    }

    const result = await setPromotionCodeActive({
      id,
      active: body.active,
      actorUserId: adminUser.id,
      requestId: request.headers.get("x-request-id"),
      requestPath: new URL(request.url).pathname,
      requestIp:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip"),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("PATCH /api/admin/business/discounts/[id] failed", error);
    return NextResponse.json({ message: "Failed to update discount code" }, { status: 500 });
  }
}
