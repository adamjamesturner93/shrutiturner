import { requireSessionUser } from "@/lib/api/auth-user";
import { getEventClearanceReviews, reviewEventHealth } from "@/lib/retreats/offering-clearance";
import { programmeError } from "@/lib/programmes/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    return Response.json(await getEventClearanceReviews(user.id, id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return programmeError(e);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    return Response.json(await reviewEventHealth(user.id, id, await request.json()));
  } catch (e) {
    return programmeError(e);
  }
}
