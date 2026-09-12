import { revalidatePath, revalidateTag } from "next/cache";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import {
  apiOk,
  badRequest,
  conflict,
  handleApiRoute,
  notFound,
  parseJsonBody,
} from "@/lib/api/route";
import { publishRetreatExperience } from "@/lib/retreats/experience-service";

export const POST = handleApiRoute(
  async ({ request, sessionUser, requestId, requestIp, path }, handlerContext) => {
    const { experienceId } = await (handlerContext as { params: Promise<{ experienceId: string }> })
      .params;
    const body = await parseJsonBody<{ revision?: unknown }>(request);
    if (typeof body.revision !== "number" || !Number.isInteger(body.revision)) {
      throw badRequest("A valid revision is required.");
    }
    let result;
    try {
      result = await publishRetreatExperience({ id: experienceId, revision: body.revision });
    } catch (error) {
      if (error instanceof Error && error.message === "EXPERIENCE_NOT_FOUND")
        throw notFound("Experience not found.");
      if (error instanceof Error && error.message === "REVISION_CONFLICT") {
        throw conflict("This experience changed in another session. Reload before publishing.");
      }
      if (error instanceof Error && error.message.startsWith("EXPERIENCE_NOT_READY:")) {
        throw badRequest(
          "Complete the title, summary, description and schedule before publishing.",
          {
            missingFields: error.message.split(":")[1]?.split(",") || [],
          }
        );
      }
      throw error;
    }
    await createAdminActionLog({
      actorUserId: sessionUser!.id,
      actionType: "retreat_experience_published",
      targetType: "retreat_experience",
      targetId: experienceId,
      requestId,
      requestIp,
      requestPath: path,
      newValueJson: { revision: result?.publishedRevision, slug: result?.slug },
    });
    revalidatePath("/retreats");
    if (result?.slug) revalidatePath(`/retreats/${result.slug}`);
    revalidatePath("/admin/retreats");
    revalidateTag("retreats-public", "max");
    return apiOk(result);
  },
  { auth: "staff_admin" }
);
