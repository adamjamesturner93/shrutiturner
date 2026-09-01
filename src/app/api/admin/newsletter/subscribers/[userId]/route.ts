import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { updateAdminSubscriber } from "@/lib/admin/newsletter-service";

type Body = {
  status?: unknown;
};

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const adminUser = await requireStaffAdminUser();
    const { userId } = await params;
    const body = (await req.json().catch(() => ({}))) as Body;
    const payload = await updateAdminSubscriber(userId, {
      status: body.status === "unsubscribed" ? "unsubscribed" : undefined,
      actorUserId: adminUser.id,
      requestId: req.headers.get("x-request-id"),
      requestPath: new URL(req.url).pathname,
      requestIp:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip"),
    });
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Subscriber not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "INVALID_UPDATE") {
      return NextResponse.json({ message: "Invalid subscriber update." }, { status: 400 });
    }
    console.error("PATCH /api/admin/newsletter/subscribers/[userId] failed", error);
    return NextResponse.json({ message: "Failed to update subscriber." }, { status: 500 });
  }
}
