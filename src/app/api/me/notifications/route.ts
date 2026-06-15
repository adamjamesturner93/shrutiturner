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
      classReminders: typeof body.classReminders === "boolean" ? body.classReminders : undefined,
      scheduleUpdates: typeof body.scheduleUpdates === "boolean" ? body.scheduleUpdates : undefined,
      programAnnouncements:
        typeof body.programAnnouncements === "boolean" ? body.programAnnouncements : undefined,
      marketingEmails: typeof body.marketingEmails === "boolean" ? body.marketingEmails : undefined,
    });
    return apiOk(prefs);
  },
  { auth: "user" }
);
