import { connection } from "next/server";
import {
  apiCreated,
  badRequest,
  conflict,
  handleApiRoute,
  notFound,
  parseJsonBody,
} from "@/lib/api/route";
import { requestRetreatCancellation } from "@/lib/retreats/service";

export const POST = handleApiRoute(
  async ({ request, sessionUser }, routeContext?: { params: Promise<{ id: string }> }) => {
    await connection();
    const { id } = await routeContext!.params;
    const body = await parseJsonBody<{ reason?: unknown }>(request);
    if (body.reason !== undefined && typeof body.reason !== "string") {
      throw badRequest("The cancellation reason must be text.");
    }
    const reason = typeof body.reason === "string" ? body.reason : undefined;
    try {
      const cancellation = await requestRetreatCancellation({
        bookingId: id,
        userId: sessionUser!.id,
        userEmail: sessionUser!.email || "",
        reason,
      });
      return apiCreated(cancellation);
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        throw notFound("Retreat booking not found.");
      }
      if (
        error instanceof Error &&
        ["CANCELLATION_NOT_AVAILABLE", "RETREAT_ALREADY_STARTED"].includes(error.message)
      ) {
        throw conflict("This booking can no longer be cancelled online.");
      }
      throw error;
    }
  },
  { auth: "user" }
);
