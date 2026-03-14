import { connection, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/account/account-service";

export async function GET() {
  try {
    await connection();
    const user = await requireSessionUser();
    const prefs = await getNotificationPreferences(user.id);
    return NextResponse.json(prefs);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/me/notifications failed", error);
    return NextResponse.json(
      { message: "Failed to load notification preferences" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const prefs = await updateNotificationPreferences(user.id, {
      classReminders: typeof body.classReminders === "boolean" ? body.classReminders : undefined,
      scheduleUpdates: typeof body.scheduleUpdates === "boolean" ? body.scheduleUpdates : undefined,
      programAnnouncements:
        typeof body.programAnnouncements === "boolean" ? body.programAnnouncements : undefined,
      marketingEmails: typeof body.marketingEmails === "boolean" ? body.marketingEmails : undefined,
    });
    return NextResponse.json(prefs);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/me/notifications failed", error);
    return NextResponse.json(
      { message: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
