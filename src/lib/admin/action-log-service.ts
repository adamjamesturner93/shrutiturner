import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function createAdminActionLog(input: {
  actorUserId: string;
  actionType: string;
  targetType: string;
  targetId?: string | null;
  reason?: string | null;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
  oldValueJson?: Prisma.InputJsonValue;
  newValueJson?: Prisma.InputJsonValue;
  metadataJson?: Prisma.InputJsonValue;
}) {
  return db.adminActionLog.create({
    data: {
      actorUserId: input.actorUserId,
      actionType: input.actionType,
      targetType: input.targetType,
      targetId: input.targetId || null,
      reason: input.reason || null,
      requestId: input.requestId || null,
      requestPath: input.requestPath || null,
      requestIp: input.requestIp || null,
      oldValueJson: input.oldValueJson,
      newValueJson: input.newValueJson,
      metadataJson: input.metadataJson,
    },
  });
}

export async function listAdminActionLogs(params?: {
  targetType?: string;
  targetId?: string;
  actionType?: string;
  actorUserId?: string;
  limit?: number;
}) {
  return db.adminActionLog.findMany({
    where: {
      targetType: params?.targetType,
      targetId: params?.targetId,
      actionType: params?.actionType,
      actorUserId: params?.actorUserId,
    },
    orderBy: { createdAt: "desc" },
    take: params?.limit || 50,
    include: {
      actor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}
