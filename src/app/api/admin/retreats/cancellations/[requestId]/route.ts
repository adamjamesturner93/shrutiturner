import { connection } from "next/server";
import { revalidatePath } from "next/cache";
import {
  apiOk,
  badRequest,
  conflict,
  handleApiRoute,
  notFound,
  parseJsonBody,
} from "@/lib/api/route";
import { approveRetreatCancellation, rejectRetreatCancellation } from "@/lib/retreats/service";

export const POST = handleApiRoute(
  async ({ request, sessionUser }, routeContext?: { params: Promise<{ requestId: string }> }) => {
    await connection();
    const { requestId } = await routeContext!.params;
    const body = await parseJsonBody<{ action?: unknown; reason?: unknown }>(request);
    if (body.action !== "approve" && body.action !== "reject") {
      throw badRequest("Action must be approve or reject.");
    }
    if (body.reason !== undefined && typeof body.reason !== "string") {
      throw badRequest("The decision reason must be text.");
    }
    const action = body.action;
    const reason = typeof body.reason === "string" ? body.reason : undefined;
    if (action === "reject" && !reason?.trim()) {
      throw badRequest("Add a reason before rejecting this request.");
    }
    try {
      const result =
        action === "approve"
          ? await approveRetreatCancellation({
              requestId,
              actorUserId: sessionUser!.id,
              reason: reason || null,
            })
          : await rejectRetreatCancellation({
              requestId,
              actorUserId: sessionUser!.id,
              reason: reason!,
            });
      revalidatePath("/admin/retreats");
      if (result.booking?.retreatDateId) {
        revalidatePath(`/admin/retreats/${result.booking.retreatDateId}`);
      }
      revalidatePath("/dashboard/retreats");
      return apiOk({ id: result.id, bookingId: result.bookingId, status: result.status });
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        throw notFound("Cancellation request not found.");
      }
      if (error instanceof Error && error.message === "CANCELLATION_ALREADY_DECIDED") {
        throw conflict("This cancellation request has already been decided.");
      }
      if (error instanceof Error && error.message === "DECISION_REASON_REQUIRED") {
        throw badRequest("Add a reason before rejecting this request.");
      }
      throw error;
    }
  },
  { auth: "staff_admin" }
);
