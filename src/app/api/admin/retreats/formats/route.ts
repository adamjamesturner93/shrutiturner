import { RetreatEventKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
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
import { createRetreatFormat, listRetreatFormats } from "@/lib/retreats/format-service";

type CreateFormatBody = {
  name?: unknown;
  description?: unknown;
  eventKind?: unknown;
  starterContent?: unknown;
  operationalDefaults?: unknown;
};

function formatInputError(error: unknown): never {
  if (error instanceof ZodError) {
    throw badRequest("Check the format defaults and try again.", { issues: error.issues });
  }
  if (error instanceof Error && error.message === "FORMAT_NAME_TAKEN") {
    throw conflict("A saved format already uses that name.");
  }
  if (error instanceof Error && error.message === "FORMAT_NAME_REQUIRED") {
    throw badRequest("A format name is required.");
  }
  throw error;
}

export const GET = handleApiRoute(
  async ({ request }) => {
    const includeArchived = new URL(request.url).searchParams.get("includeArchived") === "true";
    return apiOk(await listRetreatFormats({ includeArchived }));
  },
  { auth: "staff_admin" }
);

export const POST = handleApiRoute(
  async ({ request, sessionUser, requestId, requestIp, path }) => {
    const body = await parseJsonBody<CreateFormatBody>(request);
    if (typeof body.name !== "string" || !isRetreatEventKind(body.eventKind)) {
      throw badRequest("Name and a supported event kind are required.");
    }
    let result: Awaited<ReturnType<typeof createRetreatFormat>>;
    try {
      result = await createRetreatFormat({
        name: body.name,
        description: typeof body.description === "string" ? body.description : null,
        eventKind: body.eventKind as RetreatEventKind,
        starterContent: body.starterContent || {},
        operationalDefaults: body.operationalDefaults || {},
      });
    } catch (error) {
      formatInputError(error);
    }
    await createAdminActionLog({
      actorUserId: sessionUser!.id,
      actionType: "retreat_format_created",
      targetType: "retreat_format",
      targetId: result.id,
      requestId,
      requestIp,
      requestPath: path,
      newValueJson: { name: result.name, eventKind: result.eventKind },
    });
    revalidatePath("/admin/retreats/formats");
    revalidatePath("/admin/retreats/new");
    return apiCreated(result);
  },
  { auth: "staff_admin" }
);
