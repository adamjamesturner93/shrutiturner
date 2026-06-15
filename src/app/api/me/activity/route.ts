import { apiOk, badRequest, handleApiRoute } from "@/lib/api/route";
import { getAccountActivity } from "@/lib/account/account-activity-service";

export const GET = handleApiRoute(
  async ({ request, sessionUser }) => {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    if (limitParam && (!Number.isInteger(limit) || limit < 1 || limit > 50)) {
      throw badRequest("Limit must be a whole number between 1 and 50.");
    }

    const activity = await getAccountActivity(sessionUser!.id, {
      limit,
      cursor: url.searchParams.get("cursor") || undefined,
    });
    return apiOk(activity);
  },
  { auth: "user" }
);
