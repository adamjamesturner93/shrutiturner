import { reconcileAdminBusinessSubscriptions } from "@/lib/admin/business-service";
import { apiOk, badRequest, handleApiRoute } from "@/lib/api/route";

export const POST = handleApiRoute(
  async ({ requestId, requestIp, path, sessionUser }) => {
    if (!sessionUser?.id) throw badRequest("Missing session user.");
    return apiOk(
      await reconcileAdminBusinessSubscriptions({
        actorUserId: sessionUser.id,
        requestId,
        requestIp,
        requestPath: path,
      })
    );
  },
  { auth: "staff_admin" }
);
