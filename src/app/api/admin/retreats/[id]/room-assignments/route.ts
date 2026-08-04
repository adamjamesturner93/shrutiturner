import { connection, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { assignAdminRetreatRoomUnit } from "@/lib/retreats/service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    const user = await requireStaffAdminUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
    const roomUnitId =
      body?.roomUnitId === null
        ? null
        : typeof body?.roomUnitId === "string"
          ? body.roomUnitId.trim()
          : undefined;
    if (!bookingId || roomUnitId === undefined) {
      return NextResponse.json(
        { message: "Booking and room selection are required." },
        { status: 400 }
      );
    }
    const detail = await assignAdminRetreatRoomUnit({
      retreatDateId: id,
      bookingId,
      roomUnitId: roomUnitId || null,
      actorUserId: user.id,
    });
    revalidatePath(`/admin/retreats/${id}`);
    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }
    if (
      error instanceof Error &&
      ["ROOM_ASSIGNMENT_INVALID", "ROOM_UNIT_UNAVAILABLE", "BOOKING_NOT_ACTIVE"].includes(
        error.message
      )
    ) {
      return NextResponse.json(
        { message: "That room cannot be assigned to this booking." },
        { status: 409 }
      );
    }
    console.error("PATCH retreat room assignment failed", error);
    return NextResponse.json({ message: "Failed to update the room assignment." }, { status: 500 });
  }
}
