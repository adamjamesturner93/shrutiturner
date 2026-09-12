import { connection } from "next/server";
import { revalidatePath } from "next/cache";
import { apiOk, handleApiRoute, notFound, badRequest } from "@/lib/api/route";
import {
  getOwnRetreatRegistration,
  saveOwnRetreatRegistration,
} from "@/lib/retreats/registration-service";

type Context = { params: Promise<{ attendeeId: string }> };
export const GET = handleApiRoute(
  async ({ sessionUser }, context?: Context) => {
    await connection();
    const { attendeeId } = await context!.params;
    try {
      return apiOk(await getOwnRetreatRegistration(sessionUser!.id, attendeeId));
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND")
        throw notFound("Registration not found.");
      throw error;
    }
  },
  { auth: "user" }
);

export const PUT = handleApiRoute(
  async ({ sessionUser, request }, context?: Context) => {
    const { attendeeId } = await context!.params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw badRequest("Check your registration details.");
    try {
      const result = await saveOwnRetreatRegistration(sessionUser!.id, attendeeId, body);
      revalidatePath("/admin/retreats", "layout");
      revalidatePath("/dashboard/retreats", "layout");
      return apiOk(result);
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND")
        throw notFound("Registration not found.");
      if (error instanceof Error && error.message === "INVALID_REGISTRATION")
        throw badRequest(
          "Add your phone and emergency contact, then confirm the details are yours and current."
        );
      throw error;
    }
  },
  { auth: "user" }
);
