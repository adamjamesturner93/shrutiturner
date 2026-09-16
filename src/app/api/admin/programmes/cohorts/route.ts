import { requireSessionUser } from "@/lib/api/auth-user";
import { createProgrammeDraft } from "@/lib/programmes/admin-service";
import { programmeError } from "@/lib/programmes/http";
export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    return Response.json(await createProgrammeDraft(user.id, await request.json()));
  } catch (error) {
    return programmeError(error);
  }
}
