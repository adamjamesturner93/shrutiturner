import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { sendCoachingPaymentReminder } from "@/lib/coaching/service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireStaffAdminUser();
    const { id } = await context.params;
    const updated = await sendCoachingPaymentReminder({
      applicationId: id,
      actorUserId: adminUser.id,
      requestId: request.headers.get("x-request-id"),
      requestPath: new URL(request.url).pathname,
      requestIp:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip"),
    });
    return NextResponse.json({
      sent: true,
      paymentReminderSentAt: updated.paymentReminderSentAt?.toISOString() || null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Application not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "COACHING_PAYMENT_REMINDER_ACCOUNT_REQUIRED") {
      return NextResponse.json(
        {
          message: "The applicant needs a linked website account before payment can be requested.",
        },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "COACHING_PAYMENT_REMINDER_NOT_ALLOWED") {
      return NextResponse.json(
        {
          message: "Payment reminders can only be sent for approved applications awaiting payment.",
        },
        { status: 400 }
      );
    }
    console.error("POST /api/admin/coaching/applications/[id]/payment-reminder failed", error);
    return NextResponse.json({ message: "Failed to send payment reminder." }, { status: 500 });
  }
}
