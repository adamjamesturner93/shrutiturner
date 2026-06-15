import { EmailDeliveryStatus } from "@prisma/client";
import { db } from "@/lib/db";

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
      db.emailDelivery.count({ where: { status: EmailDeliveryStatus.failed } }),
      db.emailDelivery.count({ where: { status: EmailDeliveryStatus.dead_letter } }),
      db.emailDelivery.count({
        where: {
          status: EmailDeliveryStatus.failed,
          retryable: true,
          OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
        },
      }),
      db.emailDelivery.findFirst({
        where: {
          status: EmailDeliveryStatus.failed,
          retryable: true,
          nextRetryAt: { not: null },
        },
        orderBy: { nextRetryAt: "asc" },
        select: { nextRetryAt: true },
      }),
      db.emailDelivery.findMany({
        where: {
          status: { in: [EmailDeliveryStatus.failed, EmailDeliveryStatus.dead_letter] },
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
