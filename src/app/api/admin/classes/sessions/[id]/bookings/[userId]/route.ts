import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/auth-user";
import { removeBookingAsAdmin } from "@/lib/classes/booking-service";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const adminUser = await requireAdminUser();
    const { id, userId } = await context.params;
    const result = await removeBookingAsAdmin(id, userId, adminUser.id);
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
