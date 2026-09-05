import { connection, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { updateAdminRetreatVenueRooms } from "@/lib/retreats/service";

function integer(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : NaN;
}

export async function PUT(request: Request, context: { params: Promise<{ venueId: string }> }) {
  await connection();
  try {
    await requireStaffAdminUser();
    const { venueId } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || !Array.isArray(body.roomGroups)) {
      throw new Error("INVALID_RETREAT_VENUE_ROOMS");
    }
    const roomGroups = body.roomGroups.map((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("INVALID_RETREAT_VENUE_ROOMS");
      }
      const group = value as Record<string, unknown>;
      return {
        name: typeof group.name === "string" ? group.name : "",
        description: typeof group.description === "string" ? group.description : null,
        quantity: integer(group.quantity),
        capacityPerRoom: integer(group.capacityPerRoom),
        bedSetup: typeof group.bedSetup === "string" ? group.bedSetup : "",
        allowShared: group.allowShared === true,
        privateGuestCounts: Array.isArray(group.privateGuestCounts)
          ? group.privateGuestCounts.map(integer)
          : [],
        roomNames: Array.isArray(group.roomNames)
          ? group.roomNames.map((name) => (typeof name === "string" ? name : ""))
          : [],
      };
    });
    const venue = await updateAdminRetreatVenueRooms(venueId, roomGroups);
    revalidatePath("/admin/retreats/venues");
    revalidatePath("/admin/retreats");
    revalidateTag("retreats-public", "max");
    return NextResponse.json(venue);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "RETREAT_VENUE_NOT_FOUND") {
      return NextResponse.json({ message: "Retreat venue not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "INVALID_RETREAT_VENUE_ROOMS") {
      return NextResponse.json(
        { message: "Check the room groups and selling options." },
        { status: 400 }
      );
    }
    console.error("PUT /api/admin/retreats/venues/[venueId] failed", error);
    return NextResponse.json({ message: "Failed to save venue rooms." }, { status: 500 });
  }
}
