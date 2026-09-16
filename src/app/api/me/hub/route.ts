import { requireSessionUser } from "@/lib/api/auth-user";
import { getClientHub } from "@/lib/programmes/hub-service";
import { programmeError } from "@/lib/programmes/http";
export async function GET() {
  try {
    const user = await requireSessionUser();
    return Response.json(await getClientHub(user.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return programmeError(error);
  }
}
