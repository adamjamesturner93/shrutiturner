import { connection } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { badRequest, conflict, handleApiRoute, notFound, parseJsonBody } from "@/lib/api/route";
import { cancelAdminRetreatEvent, getAdminRetreatCancellationPreview } from "@/lib/retreats/event-cancellation";
import { getAdminRetreatDetail } from "@/lib/retreats/service";

export const GET = handleApiRoute(async (_context, routeContext?: { params: Promise<{ id: string }> }) => {
  const { id } = await routeContext!.params;
  try { return Response.json(await getAdminRetreatCancellationPreview(id), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { if (error instanceof Error && error.message === "NOT_FOUND") throw notFound("Event not found."); throw error; }
}, { auth: "staff_admin" });

export const POST = handleApiRoute(
  async ({ request, sessionUser }, routeContext?: { params: Promise<{ id: string }> }) => {
    await connection();
    const { id } = await routeContext!.params;
    const body = await parseJsonBody<{ reason?: unknown; expectedVersion?: unknown }>(request);
    if (typeof body.reason !== "string" || !body.reason.trim()) {
      throw badRequest("A cancellation reason is required.");
    }
    try {
      await cancelAdminRetreatEvent({
        retreatDateId: id,
        actorUserId: sessionUser!.id,
        reason: body.reason,
        expectedVersion: typeof body.expectedVersion === "string" ? body.expectedVersion : undefined,
      });
      revalidatePath("/retreats");
      revalidatePath("/admin/retreats");
      revalidatePath(`/admin/retreats/${id}`);
      revalidatePath("/dashboard/retreats");
      revalidateTag("retreats-public", "max");
      return Response.json(await getAdminRetreatDetail(id));
    } catch (error) {
      if (error instanceof Error && error.message === "CANCELLATION_PREVIEW_CHANGED") throw conflict("Bookings or payments have changed. Reload the cancellation summary and review it again.");
      if (error instanceof Error && error.message === "NOT_FOUND")
        throw notFound("Event not found.");
      if (error instanceof Error && error.message === "EVENT_CANCELLATION_NOT_AVAILABLE") {
        throw conflict("This event can no longer be cancelled.");
      }
      throw error;
    }
  },
  { auth: "staff_admin" }
);
