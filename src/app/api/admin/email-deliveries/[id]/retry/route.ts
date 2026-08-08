import { apiOk, conflict, handleApiRoute, notFound } from "@/lib/api/route";
import { retryAdminEmailDelivery } from "@/lib/admin/email-delivery-service";

export const POST = handleApiRoute(
  async (context, handlerContext) => {
    const { id } = await (handlerContext as { params: Promise<{ id: string }> }).params;
    if (!context.sessionUser) throw new Error("UNAUTHORIZED");

    try {
      return apiOk(
        await retryAdminEmailDelivery(id, {
          actorUserId: context.sessionUser.id,
          requestId: context.requestId,
          requestPath: context.path,
          requestIp: context.requestIp,
        })
      );
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        throw notFound("Email delivery not found.");
      }
      if (error instanceof Error && error.message === "RECIPIENT_NOT_SUBSCRIBED") {
        throw conflict(
          "This marketing recipient is no longer subscribed. The failure was dismissed."
        );
      }
      throw error;
    }
  },
  { auth: "owner_admin" }
);
