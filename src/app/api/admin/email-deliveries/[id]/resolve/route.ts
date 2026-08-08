import { apiOk, handleApiRoute, notFound, parseJsonBody } from "@/lib/api/route";
import { resolveAdminEmailDelivery } from "@/lib/admin/email-delivery-service";

type Body = { note?: string };

export const POST = handleApiRoute(
  async (context, handlerContext) => {
    const { id } = await (handlerContext as { params: Promise<{ id: string }> }).params;
    const body: Body = await parseJsonBody<Body>(context.request).catch(() => ({}));
    if (!context.sessionUser) throw new Error("UNAUTHORIZED");

    try {
      return apiOk(
        await resolveAdminEmailDelivery(id, {
          actorUserId: context.sessionUser.id,
          note: body.note,
          requestId: context.requestId,
          requestPath: context.path,
          requestIp: context.requestIp,
        })
      );
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        throw notFound("Email delivery not found.");
      }
      throw error;
    }
  },
  { auth: "owner_admin" }
);
