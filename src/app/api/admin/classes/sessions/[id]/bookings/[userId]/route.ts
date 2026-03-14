import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import {
  getSessionAccessContext,
  setManualAttendanceStatus,
} from "@/lib/classes/attendance-service";
import { removeBookingAsAdmin } from "@/lib/classes/booking-service";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const sessionUser = await requireSessionUser();
    const { id, userId } = await context.params;
    const access = await getSessionAccessContext(id, sessionUser.id);
    if (!access?.isModerator) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const result = await removeBookingAsAdmin(id, userId, sessionUser.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    console.error("DELETE /api/admin/classes/sessions/[id]/bookings/[userId] failed", error);
    return NextResponse.json({ message: "Failed to remove booking" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const sessionUser = await requireSessionUser();
    const { id, userId } = await context.params;
    const access = await getSessionAccessContext(id, sessionUser.id);
    if (!access?.isModerator) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as { status?: string };
    if (!body.status || !["booked", "attended", "no_show"].includes(body.status)) {
      return NextResponse.json({ message: "Invalid attendance status" }, { status: 400 });
    }

    const booking = await setManualAttendanceStatus({
      sessionId: id,
      bookingUserId: userId,
      status: body.status as "booked" | "attended" | "no_show",
      markedByUserId: sessionUser.id,
    });

    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "BOOKING_NOT_FOUND") {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }
    console.error("PATCH /api/admin/classes/sessions/[id]/bookings/[userId] failed", error);
    return NextResponse.json({ message: "Failed to update booking attendance" }, { status: 500 });
  }
}
