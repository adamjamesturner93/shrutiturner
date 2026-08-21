import { connection } from "next/server";
import { revalidatePath } from "next/cache";
import { badRequest, conflict, handleApiRoute, notFound, parseJsonBody } from "@/lib/api/route";
import { approveGiftCancellation, rejectGiftCancellation } from "@/lib/gifts/service";
import { getAdminRetreatDetail } from "@/lib/retreats/service";

export const POST = handleApiRoute(
  async ({ request, sessionUser }, routeContext?: { params: Promise<{ requestId: string }> }) => {
    await connection();
    const { requestId } = await routeContext!.params;
    const body = await parseJsonBody<{ action?: unknown; reason?: unknown }>(request);
    if (body.action !== "approve" && body.action !== "reject") {
      throw badRequest("Action must be approve or reject.");
    }
    const reason = typeof body.reason === "string" ? body.reason : "";
    if (body.action === "reject" && !reason.trim()) throw badRequest("Add a rejection reason.");
    try {
      const result =
        body.action === "approve"
          ? await approveGiftCancellation({ requestId, actorUserId: sessionUser!.id, reason })
          : await rejectGiftCancellation({ requestId, actorUserId: sessionUser!.id, reason });
      revalidatePath("/admin/retreats");
      revalidatePath("/dashboard/retreats");
      const retreatDateId = result.giftPurchase.retreatDateId;
      if (!retreatDateId) throw notFound("Retreat not found.");
      return Response.json(await getAdminRetreatDetail(retreatDateId));
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND")
        throw notFound("Request not found.");
      if (error instanceof Error && error.message === "CANCELLATION_ALREADY_DECIDED") {
        throw conflict("This request has already been decided.");
      }
      if (error instanceof Error && error.message === "DECISION_REASON_REQUIRED") {
        throw badRequest("Add a rejection reason.");
      }
      throw error;
    }
  },
  { auth: "staff_admin" }
);
