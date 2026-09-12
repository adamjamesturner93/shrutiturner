import { revalidatePath, revalidateTag } from "next/cache";
import { ZodError } from "zod";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import {
  apiOk,
  badRequest,
  conflict,
  handleApiRoute,
  notFound,
  parseJsonBody,
} from "@/lib/api/route";
import { getRetreatExperience, updateRetreatExperience } from "@/lib/retreats/experience-service";

type UpdateExperienceBody = { revision?: unknown; slug?: unknown; content?: unknown };

function experienceError(error: unknown): never {
  if (error instanceof ZodError) {
    throw badRequest("Check the Event Page fields and try again.", { issues: error.issues });
  }
  if (error instanceof Error && error.message === "EXPERIENCE_NOT_FOUND")
    throw notFound("Experience not found.");
  if (error instanceof Error && error.message === "REVISION_CONFLICT") {
    throw conflict("This experience changed in another session. Reload before saving again.");
  }
  if (error instanceof Error && error.message === "PUBLISHED_SLUG_LOCKED") {
    throw conflict("The public address cannot be changed after publication.");
  }
  if (error instanceof Error && error.message === "EXPERIENCE_SLUG_TAKEN") {
    throw conflict("That public address is already used by another Event Page.");
  }
  throw error;
}

export const GET = handleApiRoute(
  async (_context, handlerContext) => {
    const { experienceId } = await (handlerContext as { params: Promise<{ experienceId: string }> })
      .params;
    const experience = await getRetreatExperience(experienceId);
    if (!experience) throw notFound("Experience not found.");
    return apiOk(experience);
  },
  { auth: "staff_admin" }
);

export const PATCH = handleApiRoute(
  async ({ request, sessionUser, requestId, requestIp, path }, handlerContext) => {
    const { experienceId } = await (handlerContext as { params: Promise<{ experienceId: string }> })
      .params;
    const body = await parseJsonBody<UpdateExperienceBody>(request);
    if (typeof body.revision !== "number" || !Number.isInteger(body.revision) || !body.content) {
      throw badRequest("A revision and content are required.");
    }
    let result;
    try {
      result = await updateRetreatExperience({
        id: experienceId,
        revision: body.revision,
        slug: typeof body.slug === "string" ? body.slug : undefined,
        content: body.content,
      });
    } catch (error) {
      experienceError(error);
    }
    await createAdminActionLog({
      actorUserId: sessionUser!.id,
      actionType: "retreat_experience_draft_saved",
      targetType: "retreat_experience",
      targetId: experienceId,
      requestId,
      requestIp,
      requestPath: path,
      newValueJson: { revision: result?.revision },
    });
    revalidatePath("/admin/retreats");
    revalidateTag("retreats-public", "max");
    return apiOk(result);
  },
  { auth: "staff_admin" }
);
