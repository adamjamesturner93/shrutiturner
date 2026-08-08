import { EmailDeliveryStatus } from "@prisma/client";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { db } from "@/lib/db";
import { attemptEmailDelivery } from "@/lib/postmark/client";

export type AdminEmailDeliveryHealthDto = {
  failedCount: number;
  deadLetterCount: number;
  retryQueuedCount: number;
  nextRetryAt: string | null;
  recentFailures: Array<{
    id: string;
    toEmail: string;
    templateKey: string;
    category: string;
    subject: string;
    status: "failed" | "dead_letter";
    attemptCount: number;
    maxAttempts: number;
    nextRetryAt: string | null;
    lastError: string | null;
    updatedAt: string;
  }>;
};

export async function getAdminEmailDeliveryHealth(): Promise<AdminEmailDeliveryHealthDto> {
  const now = new Date();
  const [failedCount, deadLetterCount, retryQueuedCount, nextRetry, recentFailures] =
    await Promise.all([
      db.emailDelivery.count({
        where: { status: EmailDeliveryStatus.failed, resolvedAt: null },
      }),
      db.emailDelivery.count({
        where: { status: EmailDeliveryStatus.dead_letter, resolvedAt: null },
      }),
      db.emailDelivery.count({
        where: {
          status: EmailDeliveryStatus.failed,
          resolvedAt: null,
          retryable: true,
          OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
        },
      }),
      db.emailDelivery.findFirst({
        where: {
          status: EmailDeliveryStatus.failed,
          resolvedAt: null,
          retryable: true,
          nextRetryAt: { not: null },
        },
        orderBy: { nextRetryAt: "asc" },
        select: { nextRetryAt: true },
      }),
      db.emailDelivery.findMany({
        where: {
          status: { in: [EmailDeliveryStatus.failed, EmailDeliveryStatus.dead_letter] },
          resolvedAt: null,
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          toEmail: true,
          templateKey: true,
          category: true,
          subject: true,
          status: true,
          attemptCount: true,
          maxAttempts: true,
          nextRetryAt: true,
          lastError: true,
          updatedAt: true,
        },
      }),
    ]);

  return {
    failedCount,
    deadLetterCount,
    retryQueuedCount,
    nextRetryAt: nextRetry?.nextRetryAt?.toISOString() || null,
    recentFailures: recentFailures.map((delivery) => ({
      id: delivery.id,
      toEmail: delivery.toEmail,
      templateKey: delivery.templateKey,
      category: delivery.category,
      subject: delivery.subject,
      status:
        delivery.status === EmailDeliveryStatus.dead_letter
          ? EmailDeliveryStatus.dead_letter
          : EmailDeliveryStatus.failed,
      attemptCount: delivery.attemptCount,
      maxAttempts: delivery.maxAttempts,
      nextRetryAt: delivery.nextRetryAt?.toISOString() || null,
      lastError: delivery.lastError,
      updatedAt: delivery.updatedAt.toISOString(),
    })),
  };
}

type DeliveryActionContext = {
  actorUserId: string;
  requestId?: string | null;
  requestPath?: string | null;
  requestIp?: string | null;
};

export async function resolveAdminEmailDelivery(
  deliveryId: string,
  context: DeliveryActionContext & { note?: string | null }
) {
  const existing = await db.emailDelivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      status: true,
      toEmail: true,
      templateKey: true,
      resolvedAt: true,
    },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const resolvedAt = existing.resolvedAt || new Date();
  await db.emailDelivery.update({
    where: { id: deliveryId },
    data: {
      resolvedAt,
      resolvedByUserId: context.actorUserId,
      resolutionCode: "dismissed_by_admin",
      resolutionNote: context.note?.trim() || null,
      retryable: false,
      nextRetryAt: null,
    },
  });

  await createAdminActionLog({
    actorUserId: context.actorUserId,
    actionType: "email_delivery_resolved",
    targetType: "email_delivery",
    targetId: deliveryId,
    reason: context.note,
    requestId: context.requestId,
    requestPath: context.requestPath,
    requestIp: context.requestIp,
    oldValueJson: {
      ...existing,
      resolvedAt: existing.resolvedAt?.toISOString() || null,
    },
    newValueJson: { resolvedAt: resolvedAt.toISOString(), resolutionCode: "dismissed_by_admin" },
  });

  return { id: deliveryId, resolvedAt: resolvedAt.toISOString() };
}

export async function retryAdminEmailDelivery(deliveryId: string, context: DeliveryActionContext) {
  const existing = await db.emailDelivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      status: true,
      category: true,
      toEmail: true,
      attemptCount: true,
      maxAttempts: true,
      resolvedAt: true,
    },
  });
  if (!existing) throw new Error("NOT_FOUND");

  if (existing.category === "marketing") {
    const subscriber = await db.newsletterSubscriber.findUnique({
      where: { email: existing.toEmail.trim().toLowerCase() },
      select: { status: true },
    });
    if (!subscriber || subscriber.status !== "subscribed") {
      await db.emailDelivery.update({
        where: { id: deliveryId },
        data: {
          resolvedAt: new Date(),
          resolvedByUserId: context.actorUserId,
          resolutionCode: "recipient_not_subscribed",
          resolutionNote:
            "Marketing delivery was not retried because the recipient is not subscribed.",
          retryable: false,
          nextRetryAt: null,
        },
      });
      throw new Error("RECIPIENT_NOT_SUBSCRIBED");
    }
  }

  await db.emailDelivery.update({
    where: { id: deliveryId },
    data: {
      status: EmailDeliveryStatus.queued,
      retryable: true,
      maxAttempts: Math.max(existing.maxAttempts, existing.attemptCount + 1),
      nextRetryAt: null,
      resolvedAt: null,
      resolvedByUserId: null,
      resolutionCode: null,
      resolutionNote: null,
    },
  });

  await createAdminActionLog({
    actorUserId: context.actorUserId,
    actionType: "email_delivery_retried",
    targetType: "email_delivery",
    targetId: deliveryId,
    requestId: context.requestId,
    requestPath: context.requestPath,
    requestIp: context.requestIp,
    oldValueJson: {
      ...existing,
      resolvedAt: existing.resolvedAt?.toISOString() || null,
    },
  });

  return attemptEmailDelivery(deliveryId);
}
