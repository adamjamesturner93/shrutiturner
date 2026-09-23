import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireStaffAdminUser } from "@/lib/api/auth-user";
import { applyVenueRoomSync, previewVenueRoomSync } from "@/lib/retreats/venue-sync-service";

type Context = { params: Promise<{ venueId: string }> };
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const messages: Record<string, string> = {
    UNAUTHORIZED: "Sign in to continue.",
    FORBIDDEN: "Staff access required.",
    NOT_FOUND: "Retreat not found.",
    VENUE_SYNC_STALE: "The venue or bookings changed. Review the latest changes before applying.",
    VENUE_SYNC_CONFLICT: "Resolve the conflicts shown in the preview before applying.",
    VENUE_SYNC_PRICE_REQUIRED: "Enter a positive price for every new room occupancy.",
    VENUE_SYNC_CAPACITY_CONFLICT:
      "Event capacity exceeds the updated physical room capacity. Review capacity before applying.",
    VENUE_SYNC_UNAVAILABLE: "Only future, non-cancelled retreats can be updated.",
    INVALID_REQUEST: "Check the selected retreat and room prices.",
  };
  if (!messages[code]) console.error("Venue room sync failed", error);
  return NextResponse.json(
    {
      message:
        messages[code] ||
        "The room update could not be applied. Refresh the preview and try again.",
    },
    {
      status:
        code === "UNAUTHORIZED"
          ? 401
          : code === "FORBIDDEN"
            ? 403
            : code === "NOT_FOUND"
              ? 404
              : code === "INVALID_REQUEST" || code === "VENUE_SYNC_PRICE_REQUIRED"
                ? 400
                : 409,
    }
  );
}
export async function GET(_request: Request, context: Context) {
  try {
    await requireStaffAdminUser();
    return NextResponse.json(await previewVenueRoomSync((await context.params).venueId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    const actor = await requireStaffAdminUser();
    const { venueId } = await context.params;
    const body = (await request.json()) as {
      dateId?: unknown;
      revision?: unknown;
      prices?: unknown;
    };
    if (
      !body ||
      typeof body.dateId !== "string" ||
      typeof body.revision !== "string" ||
      !body.prices ||
      typeof body.prices !== "object" ||
      Array.isArray(body.prices)
    )
      throw new Error("INVALID_REQUEST");
    const prices: Record<string, number> = {};
    for (const [key, value] of Object.entries(body.prices)) {
      if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0)
        throw new Error("INVALID_REQUEST");
      prices[key] = value;
    }
    const result = await applyVenueRoomSync({
      contentfulVenueId: venueId,
      dateId: body.dateId,
      revision: body.revision,
      prices,
      actorUserId: actor.id,
    });
    revalidatePath("/admin/retreats", "layout");
    revalidatePath(`/retreats/${result.retreatSlug}`);
    revalidateTag("retreats-public", "max");
    return NextResponse.json({ id: result.id });
  } catch (error) {
    return failure(error);
  }
}
