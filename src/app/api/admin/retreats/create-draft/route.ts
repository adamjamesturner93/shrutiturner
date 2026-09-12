import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { apiCreated, apiOk, badRequest, conflict, handleApiRoute, parseJsonBody } from "@/lib/api/route";
import { createEventDraft } from "@/lib/retreats/creation-service";
import { db } from "@/lib/db";

export const GET = handleApiRoute(async ({ request, sessionUser }) => {
  const key = new URL(request.url).searchParams.get("key");
  if (!key || !/^[a-f0-9-]{36}$/i.test(key)) throw badRequest("Invalid creation request.");
  const result = await db.adminEventCreation.findUnique({ where: { key: `${sessionUser!.id}:${key}` } });
  return apiOk(result ? { id: result.dateId } : null, { headers: { "Cache-Control": "private, no-store" } });
}, { auth: "staff_admin" });

export const POST = handleApiRoute(async ({ request, sessionUser }) => {
  const body = await parseJsonBody<unknown>(request);
  try {
    const result = await createEventDraft(sessionUser!.id, body);
    revalidatePath("/admin/retreats");
    return apiCreated(result);
  } catch (error) {
    if (error instanceof ZodError) throw badRequest("Check the event fields.", { issues: error.issues });
    if (error instanceof Error && ["CREATION_REQUEST_CONFLICT", "EXPERIENCE_SLUG_TAKEN"].includes(error.message)) throw conflict("This request or public address is already used. Your saved event has not been overwritten.");
    if (error instanceof Error && ["CHOOSE_NEW_OR_EXISTING_PAGE", "RETREAT_VENUE_REQUIRED", "RETREAT_VENUE_ROOMS_REQUIRED", "EXPERIENCE_NOT_FOUND", "FORMAT_NOT_FOUND", "END_TIME_REQUIRED", "INVALID_DATE_RANGE", "INVALID_CAPACITY", "INVALID_PRICE", "RETREAT_TYPE_MISMATCH"].includes(error.message)) throw badRequest(error.message.replaceAll("_", " ").toLowerCase());
    throw error;
  }
}, { auth: "staff_admin" });
