import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function recordUserLifecycleEvent(input: {
  eventType: "user_created" | "user_logged_in" | "user_updated" | "user_deleted";
  userId?: string | null;
  actorUserId?: string | null;
  payload?: Prisma.InputJsonValue;
}) {
  return db.userLifecycleEvent.create({
    data: {
      eventType: input.eventType,
      userId: input.userId || null,
      actorUserId: input.actorUserId || null,
      payloadJson: input.payload,
    },
  });
}
