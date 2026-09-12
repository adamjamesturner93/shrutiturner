import { NextResponse } from "next/server";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { sendRetreatRegistrationInvitation } from "@/lib/retreats/registration-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; attendeeId: string }> }
) {
  try {
    await requireStaffAdminUser();
    const { id, attendeeId } = await context.params;
    return NextResponse.json(
      await sendRetreatRegistrationInvitation(attendeeId, { retreatDateId: id })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : message === "NOT_FOUND"
            ? 404
            : 500;
    return NextResponse.json(
      {
        message:
          status === 500 ? "Unable to send invitation. Try again." : "Invitation unavailable.",
      },
      { status }
    );
  }
}
