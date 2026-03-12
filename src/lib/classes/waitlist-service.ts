import { ClassWaitlistStatus } from "@prisma/client";
import { db } from "@/lib/db";

export async function getNextWaitlistPosition(sessionId: string, tx: typeof db = db) {
  const last = await tx.classWaitlistEntry.findFirst({
    where: { sessionId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return (last?.position || 0) + 1;
}

export async function joinWaitlist(sessionId: string, userId: string, tx: typeof db = db) {
  const existing = await tx.classWaitlistEntry.findFirst({
    where: { sessionId, userId, status: ClassWaitlistStatus.waiting },
  });
  if (existing) return existing;

  const position = await getNextWaitlistPosition(sessionId, tx);
  return tx.classWaitlistEntry.create({
    data: {
      sessionId,
      userId,
      position,
      status: ClassWaitlistStatus.waiting,
    },
  });
}

export async function removeFromWaitlist(sessionId: string, userId: string, tx: typeof db = db) {
  const entry = await tx.classWaitlistEntry.findFirst({
    where: { sessionId, userId, status: ClassWaitlistStatus.waiting },
  });
  if (!entry) return null;

  await tx.classWaitlistEntry.update({
    where: { id: entry.id },
    data: { status: ClassWaitlistStatus.removed },
  });

  return entry;
}

export async function getFirstWaiting(sessionId: string, tx: typeof db = db) {
  return tx.classWaitlistEntry.findFirst({
    where: { sessionId, status: ClassWaitlistStatus.waiting },
    orderBy: { position: "asc" },
  });
}
