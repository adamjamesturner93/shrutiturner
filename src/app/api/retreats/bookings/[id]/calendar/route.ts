import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { buildCalendarInvite } from "@/lib/email";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { db } from "@/lib/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const booking = await db.retreatBooking.findFirst({
      where: { id, OR: [{ attendeeUserId: user.id }, { purchaserUserId: user.id }] },
      include: { retreatDate: true },
    });
    if (!booking) return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    const joinUrl = buildAbsoluteUrl(`/dashboard/retreats/${booking.id}/live`);
    const invite = buildCalendarInvite({
      eventName: booking.retreatDate.retreatTitleSnapshot,
      startTime: booking.retreatDate.startsAt,
      durationMinutes: Math.max(
        1,
        Math.ceil(
          (booking.retreatDate.endsAt.getTime() - booking.retreatDate.startsAt.getTime()) / 60000
        )
      ),
      description: `Open the secure retreat landing page: ${joinUrl}`,
      location: "Private Studio (online)",
      url: joinUrl,
    });
    return new NextResponse(invite, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="retreat-${booking.id}.ics"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Unable to create calendar event." }, { status: 500 });
  }
}
