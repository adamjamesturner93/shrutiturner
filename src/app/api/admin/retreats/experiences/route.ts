import { ZodError } from "zod";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import {
  apiCreated,
  apiOk,
  badRequest,
  conflict,
  handleApiRoute,
  parseJsonBody,
} from "@/lib/api/route";
import { isRetreatEventKind } from "@/lib/retreats/event-capabilities";
import { createRetreatExperience, listRetreatExperiences } from "@/lib/retreats/experience-service";

type CreateExperienceBody = {
  title?: unknown;
  slug?: unknown;
  eventKind?: unknown;
  formatPresetId?: unknown;
  content?: unknown;
};

function experienceInputError(error: unknown): never {
  if (error instanceof ZodError) {
    throw badRequest("Check the Event Page fields and try again.", { issues: error.issues });
  }
  if (error instanceof Error && error.message === "EXPERIENCE_SLUG_TAKEN") {
    throw conflict("That public address is already used by another Event Page.");
  }
  if (
    error instanceof Error &&
    [
      "EXPERIENCE_TITLE_REQUIRED",
      "EXPERIENCE_SLUG_REQUIRED",
      "EVENT_KIND_REQUIRED",
      "FORMAT_NOT_FOUND",
      "FORMAT_KIND_MISMATCH",
    ].includes(error.message)
  ) {
    throw badRequest("Choose a compatible format and complete the required Event Page fields.");
  }
  throw error;
}

export const GET = handleApiRoute(
  async ({ request }) => {
    const publishedOnly = new URL(request.url).searchParams.get("publishedOnly") === "true";
    return apiOk(await listRetreatExperiences({ publishedOnly }));
  },
  { auth: "staff_admin" }
);

export const POST = handleApiRoute(
  async ({ request, sessionUser, requestId, requestIp, path }) => {
    const body = await parseJsonBody<CreateExperienceBody>(request);
    if (typeof body.title !== "string" || !body.title.trim()) {
      throw badRequest("A title is required.");
    }
    if (body.eventKind !== undefined && !isRetreatEventKind(body.eventKind)) {
      throw badRequest("Choose a supported event kind.");
    }
    let result: Awaited<ReturnType<typeof createRetreatExperience>>;
    try {
      result = await createRetreatExperience({
        title: body.title,
        slug: typeof body.slug === "string" ? body.slug : undefined,
        eventKind: isRetreatEventKind(body.eventKind) ? body.eventKind : undefined,
        formatPresetId: typeof body.formatPresetId === "string" ? body.formatPresetId : null,
        content: body.content,
      });
    } catch (error) {
      experienceInputError(error);
    }
    await createAdminActionLog({
      actorUserId: sessionUser!.id,
      actionType: "retreat_experience_created",
      targetType: "retreat_experience",
      targetId: result.id,
      requestId,
      requestIp,
      requestPath: path,
      newValueJson: { title: result.title, slug: result.slug, eventKind: result.eventKind },
    });
    return apiCreated(result);
  },
  { auth: "staff_admin" }
);
