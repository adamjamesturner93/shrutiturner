import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { updateAdminSubscriber } from "@/lib/admin/newsletter-service";

type Body = {
  newsletter?: unknown;
  blogUpdates?: unknown;
  marketingEmails?: unknown;
};

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireAdminUser();
    const { userId } = await params;
    const body = (await req.json().catch(() => ({}))) as Body;
    const payload = await updateAdminSubscriber(userId, {
      newsletter: typeof body.newsletter === "boolean" ? body.newsletter : undefined,
      blogUpdates: typeof body.blogUpdates === "boolean" ? body.blogUpdates : undefined,
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
    console.error("PATCH /api/admin/newsletter/subscribers/[userId] failed", error);
    return NextResponse.json({ message: "Failed to update subscriber." }, { status: 500 });
  }
}
