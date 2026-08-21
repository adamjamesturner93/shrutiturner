import { connection } from "next/server";
import {
  apiCreated,
  badRequest,
  conflict,
  handleApiRoute,
  notFound,
  parseJsonBody,
} from "@/lib/api/route";
import { requestGiftCancellation } from "@/lib/gifts/service";

export const POST = handleApiRoute(
  async ({ request, sessionUser }, routeContext?: { params: Promise<{ giftId: string }> }) => {
    await connection();
    const { giftId } = await routeContext!.params;
    const body = await parseJsonBody<{ reason?: unknown }>(request);
    if (body.reason !== undefined && typeof body.reason !== "string") {
      throw badRequest("The cancellation reason must be text.");
    }
    try {
      return apiCreated(
        await requestGiftCancellation({
          giftPurchaseId: giftId,
          userId: sessionUser!.id,
          userEmail: sessionUser!.email || "",
          reason: typeof body.reason === "string" ? body.reason : null,
        })
      );
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND")
        throw notFound("Gift not found.");
      if (
        error instanceof Error &&
        ["GIFT_ALREADY_REDEEMED", "GIFT_CANCELLATION_NOT_AVAILABLE"].includes(error.message)
      ) {
        throw conflict(
          error.message === "GIFT_ALREADY_REDEEMED"
            ? "This gift has been redeemed; manage cancellation from the linked booking."
            : "This gift can no longer be cancelled online."
        );
      }
      throw error;
    }
  },
  { auth: "user" }
);
