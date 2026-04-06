import { ParticipantModerationActionType, Prisma } from "@prisma/client";
import { canModerateLiveSession } from "@/lib/authz/access";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { db } from "@/lib/db";

async function assertSessionModerationAccess(actorUserId: string, sessionId: string) {
  const allowed = await canModerateLiveSession(actorUserId, sessionId);
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }
}

export async function listSessionModerationHistory(sessionId: string, actorUserId: string) {
  await assertSessionModerationAccess(actorUserId, sessionId);
  return db.participantModerationAction.findMany({
    where: { sessionId },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function blockSessionParticipant(input: {
  sessionId: string;
  userId: string;
  actorUserId: string;
  reason: string;
  blockedUntil?: Date | null;
}) {
  await assertSessionModerationAccess(input.actorUserId, input.sessionId);
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("MODERATION_REASON_REQUIRED");
  }

  const [block, action] = await db.$transaction([
    db.sessionParticipantBlock.upsert({
      where: {
        sessionId_userId_active: {
          sessionId: input.sessionId,
          userId: input.userId,
          active: true,
        },
      },
      create: {
        sessionId: input.sessionId,
        userId: input.userId,
        actorUserId: input.actorUserId,
        reason,
        blockedUntil: input.blockedUntil || null,
      },
      update: {
        actorUserId: input.actorUserId,
        reason,
        blockedUntil: input.blockedUntil || null,
        active: true,
        liftedAt: null,
      },
    }),
    db.participantModerationAction.create({
      data: {
        sessionId: input.sessionId,
        userId: input.userId,
        actorUserId: input.actorUserId,
        actionType: ParticipantModerationActionType.block_reentry,
        reason,
      },
    }),
  ]);

  await createAdminActionLog({
    actorUserId: input.actorUserId,
    actionType: "session_participant_blocked",
    targetType: "session_participant_block",
    targetId: block.id,
    reason,
    metadataJson: {
      sessionId: input.sessionId,
      userId: input.userId,
      moderationActionId: action.id,
    },
  });

  return { block, action };
}

export async function unblockSessionParticipant(input: {
  sessionId: string;
  userId: string;
  actorUserId: string;
  reason: string;
}) {
  await assertSessionModerationAccess(input.actorUserId, input.sessionId);
  const block = await db.sessionParticipantBlock.findFirst({
    where: {
      sessionId: input.sessionId,
      userId: input.userId,
      active: true,
    },
  });
  if (!block) {
    throw new Error("PARTICIPANT_BLOCK_NOT_FOUND");
  }

  const [updated, action] = await db.$transaction([
    db.sessionParticipantBlock.update({
      where: { id: block.id },
      data: {
        active: false,
        liftedAt: new Date(),
      },
    }),
    db.participantModerationAction.create({
      data: {
        sessionId: input.sessionId,
        userId: input.userId,
        actorUserId: input.actorUserId,
        actionType: ParticipantModerationActionType.unblock_reentry,
        reason: input.reason.trim(),
      },
    }),
  ]);

  return { block: updated, action };
}

export async function removeSessionParticipant(input: {
  sessionId: string;
  userId: string;
  actorUserId: string;
  reason: string;
  metadataJson?: Record<string, unknown> | null;
}) {
  await assertSessionModerationAccess(input.actorUserId, input.sessionId);
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("MODERATION_REASON_REQUIRED");
  }

  const action = await db.participantModerationAction.create({
    data: {
      sessionId: input.sessionId,
      userId: input.userId,
      actorUserId: input.actorUserId,
      actionType: ParticipantModerationActionType.removed,
      reason,
      metadataJson: input.metadataJson ? (input.metadataJson as Prisma.InputJsonValue) : undefined,
    },
  });

  await createAdminActionLog({
    actorUserId: input.actorUserId,
    actionType: "session_participant_removed",
    targetType: "participant_moderation_action",
    targetId: action.id,
    reason,
    metadataJson: {
      sessionId: input.sessionId,
      userId: input.userId,
    },
  });

  return action;
}
