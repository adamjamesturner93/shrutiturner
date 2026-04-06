import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { updateAdminSubscriber } from "@/lib/admin/newsletter-service";

type Body = {
  marketingEmails?: unknown;
};

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireStaffAdminUser();
    const { userId } = await params;
    const body = (await req.json().catch(() => ({}))) as Body;
    const payload = await updateAdminSubscriber(userId, {
      marketingEmails: typeof body.marketingEmails === "boolean" ? body.marketingEmails : undefined,
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
    if (error instanceof Error && error.message === "SELF_SERVICE_OPT_IN_REQUIRED") {
      return NextResponse.json(
        {
          message:
            "This subscriber must opt back in themselves before marketing can be re-enabled.",
        },
        { status: 409 }
      );
    }
    console.error("PATCH /api/admin/newsletter/subscribers/[userId] failed", error);
    return NextResponse.json({ message: "Failed to update subscriber." }, { status: 500 });
  }
}
