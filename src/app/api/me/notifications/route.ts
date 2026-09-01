import { connection } from "next/server";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/account/account-service";
import { apiOk, handleApiRoute, parseJsonBody } from "@/lib/api/route";

export const GET = handleApiRoute(
  async ({ sessionUser }) => {
    await connection();
    const prefs = await getNotificationPreferences(sessionUser!.id);
    return apiOk(prefs);
  },
  { auth: "user" }
);

export const PATCH = handleApiRoute(
  async ({ request, sessionUser }) => {
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const prefs = await updateNotificationPreferences(sessionUser!.id, {
      newsletterSubscribed:
        typeof body.newsletterSubscribed === "boolean" ? body.newsletterSubscribed : undefined,
    });
    return apiOk(prefs);
  },
  { auth: "user" }
);
