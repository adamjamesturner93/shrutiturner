import { connection } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { badRequest, conflict, handleApiRoute, notFound, parseJsonBody } from "@/lib/api/route";
import { cancelAdminRetreatEvent } from "@/lib/retreats/event-cancellation";
import { getAdminRetreatDetail } from "@/lib/retreats/service";

export const POST = handleApiRoute(
  async ({ request, sessionUser }, routeContext?: { params: Promise<{ id: string }> }) => {
    await connection();
    const { id } = await routeContext!.params;
    const body = await parseJsonBody<{ reason?: unknown }>(request);
    if (typeof body.reason !== "string" || !body.reason.trim()) {
      throw badRequest("A cancellation reason is required.");
    }
    try {
      await cancelAdminRetreatEvent({
        retreatDateId: id,
        actorUserId: sessionUser!.id,
        reason: body.reason,
      });
      revalidatePath("/retreats");
      revalidatePath("/admin/retreats");
      revalidatePath(`/admin/retreats/${id}`);
      revalidatePath("/dashboard/retreats");
      revalidateTag("retreats-public", "max");
      return Response.json(await getAdminRetreatDetail(id));
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND")
        throw notFound("Workshop not found.");
      if (error instanceof Error && error.message === "EVENT_CANCELLATION_NOT_AVAILABLE") {
        throw conflict("This workshop can no longer be cancelled.");
      }
      throw error;
    }
  },
  { auth: "staff_admin" }
);
