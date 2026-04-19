import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function recordUserLifecycleEvent(input: {
  eventType: string;
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
