import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { ZodError } from "zod";
import {
  apiOk,
  badRequest,
  conflict,
  handleApiRoute,
  notFound,
  parseJsonBody,
} from "@/lib/api/route";
import { getRetreatFormat, updateRetreatFormat } from "@/lib/retreats/format-service";

type UpdateFormatBody = {
  revision?: unknown;
  name?: unknown;
  description?: unknown;
  starterContent?: unknown;
  operationalDefaults?: unknown;
  active?: unknown;
};

function formatError(error: unknown): never {
  if (error instanceof ZodError) {
    throw badRequest("Check the format defaults and try again.", { issues: error.issues });
  }
  if (error instanceof Error && error.message === "FORMAT_NOT_FOUND")
    throw notFound("Format not found.");
  if (error instanceof Error && error.message === "REVISION_CONFLICT") {
    throw conflict("This format changed in another session. Reload before saving again.");
  }
  if (error instanceof Error && error.message === "FORMAT_NAME_TAKEN") {
    throw conflict("A saved format already uses that name.");
  }
  throw error;
}

export const GET = handleApiRoute(
  async (_context, handlerContext) => {
    const { formatId } = await (handlerContext as { params: Promise<{ formatId: string }> }).params;
    const format = await getRetreatFormat(formatId);
    if (!format) throw notFound("Format not found.");
    return apiOk(format);
  },
  { auth: "staff_admin" }
);

export const PATCH = handleApiRoute(
  async ({ request, sessionUser, requestId, requestIp, path }, handlerContext) => {
    const { formatId } = await (handlerContext as { params: Promise<{ formatId: string }> }).params;
    const body = await parseJsonBody<UpdateFormatBody>(request);
    if (typeof body.revision !== "number" || !Number.isInteger(body.revision)) {
      throw badRequest("A valid format revision is required.");
    }
    const description =
      body.description === null
        ? null
        : typeof body.description === "string"
          ? body.description
          : undefined;
    let result;
    try {
      result = await updateRetreatFormat({
        id: formatId,
        revision: body.revision,
        name: typeof body.name === "string" ? body.name : undefined,
        description,
        starterContent: body.starterContent,
        operationalDefaults: body.operationalDefaults,
        active: typeof body.active === "boolean" ? body.active : undefined,
      });
    } catch (error) {
      formatError(error);
    }
    await createAdminActionLog({
      actorUserId: sessionUser!.id,
      actionType: body.active === false ? "retreat_format_archived" : "retreat_format_updated",
      targetType: "retreat_format",
      targetId: formatId,
      requestId,
      requestIp,
      requestPath: path,
      newValueJson: { revision: result?.revision, active: result?.active },
    });
    return apiOk(result);
  },
  { auth: "staff_admin" }
);
