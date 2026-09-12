import "server-only";
import { createHash } from "node:crypto";

import {
  GiftPurchaseStatus,
  RetreatBookingStatus,
  RetreatCancellationSource,
  RetreatCancellationStatus,
  RetreatPaymentStatus,
} from "@prisma/client";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { stopRoomRecording } from "@/lib/daily/service";
import { db } from "@/lib/db";
import WorkshopCancelledEmail from "@/emails/workshop-cancelled";
import { approveGiftCancellation } from "@/lib/gifts/service";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";
import { approveRetreatCancellation } from "@/lib/retreats/service";

const CANCELLABLE_BOOKING_STATUSES: RetreatBookingStatus[] = [
  RetreatBookingStatus.pending,
  RetreatBookingStatus.deposit_paid,
  RetreatBookingStatus.balance_due,
  RetreatBookingStatus.paid_in_full,
];
const PAID_STATUSES: RetreatPaymentStatus[] = [
  RetreatPaymentStatus.deposit_paid,
  RetreatPaymentStatus.partially_paid,
  RetreatPaymentStatus.paid_in_full,
];

type CancellationSnapshot = {
  id: string; status: string;
  bookings: Array<{ id: string; attendeeCount: number; depositPaidPence: number; balancePaidPence: number; giftPurchase: { totalPaidPence: number; refundedAmountPence: number } | null; refunds: Array<{ amountPence: number }> }>;
  giftPurchases: Array<{ id: string; status: string; totalPaidPence: number; refundedAmountPence: number }>;
};

function cancellationPreview(date: CancellationSnapshot) {
  const bookings = date.bookings.map((booking) => ({
    id: booking.id, guests: booking.attendeeCount,
    refund: Math.max(0, (booking.giftPurchase ? booking.giftPurchase.totalPaidPence - booking.giftPurchase.refundedAmountPence : booking.depositPaidPence + booking.balancePaidPence) - booking.refunds.reduce((sum, refund) => sum + refund.amountPence, 0)),
  })).sort((a, b) => a.id.localeCompare(b.id));
  const gifts = date.giftPurchases.map((gift) => ({ id: gift.id, refund: gift.status === "purchased" ? Math.max(0, gift.totalPaidPence - gift.refundedAmountPence) : 0 })).sort((a, b) => a.id.localeCompare(b.id));
  return {
    available: !["cancelled", "completed"].includes(date.status),
    bookingCount: bookings.length, guestCount: bookings.reduce((sum, row) => sum + row.guests, 0), giftCount: gifts.length,
    refundPence: [...bookings, ...gifts].reduce((sum, row) => sum + row.refund, 0),
    version: createHash("sha256").update(JSON.stringify({ id: date.id, status: date.status, bookings, gifts })).digest("hex"),
  };
}

export async function getAdminRetreatCancellationPreview(id: string) {
  const date = await db.retreatDate.findUnique({ where: { id }, include: {
    bookings: { where: { bookingStatus: { in: CANCELLABLE_BOOKING_STATUSES } }, include: { giftPurchase: true, refunds: { where: { status: "succeeded" } } } },
    giftPurchases: { where: { type: "retreat", status: { in: [GiftPurchaseStatus.pending_payment, GiftPurchaseStatus.purchased] }, retreatBooking: null } },
  } });
  if (!date) throw new Error("NOT_FOUND");
  return cancellationPreview(date);
}

export async function cancelAdminRetreatEvent(input: {
  retreatDateId: string;
  actorUserId: string;
  reason: string;
  expectedVersion?: string;
}) {
  const reason = input.reason.trim().slice(0, 2000);
  if (!reason) throw new Error("CANCELLATION_REASON_REQUIRED");

  const actor = await db.user.findUnique({
    where: { id: input.actorUserId },
    select: { email: true },
  });
  if (!actor) throw new Error("FORBIDDEN");

  const prepared = await db.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`retreat-event-cancellation:${input.retreatDateId}`})) IS NULL AS "acquired"
    `;
    const retreatDate = await tx.retreatDate.findUnique({
      where: { id: input.retreatDateId },
      include: {
        bookings: {
          where: {
            bookingStatus: { in: CANCELLABLE_BOOKING_STATUSES },
          },
          include: {
            attendees: {
              where: { status: { not: "cancelled" } },
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            },
            refunds: { where: { status: "succeeded" } },
            cancellationRequests: { orderBy: { requestedAt: "desc" }, take: 1 },
            giftPurchase: true,
            instalments: true,
          },
        },
        giftPurchases: {
          where: {
            type: "retreat",
            status: { in: [GiftPurchaseStatus.pending_payment, GiftPurchaseStatus.purchased] },
            retreatBooking: null,
          },
          include: { cancellationRequests: { orderBy: { requestedAt: "desc" }, take: 1 } },
        },
      },
    });
    if (!retreatDate) throw new Error("NOT_FOUND");
    if (input.expectedVersion && cancellationPreview(retreatDate).version !== input.expectedVersion) throw new Error("CANCELLATION_PREVIEW_CHANGED");
    if (["cancelled", "completed"].includes(retreatDate.status)) {
      throw new Error("EVENT_CANCELLATION_NOT_AVAILABLE");
    }

    const bookingRequestIds: string[] = [];
    for (const booking of retreatDate.bookings) {
      const paid = booking.giftPurchase
        ? booking.giftPurchase.totalPaidPence - booking.giftPurchase.refundedAmountPence
        : booking.depositPaidPence + booking.balancePaidPence;
      const alreadyRefunded = booking.refunds.reduce((sum, refund) => sum + refund.amountPence, 0);
      const refundableAmountPence = Math.max(paid - alreadyRefunded, 0);
      const latest = booking.cancellationRequests[0];
      const request =
        latest && ["requested", "failed"].includes(latest.status)
          ? await tx.retreatCancellationRequest.update({
              where: { id: latest.id },
              data: {
                source: RetreatCancellationSource.event_cancelled,
                status: RetreatCancellationStatus.requested,
                refundableAmountPence,
                reason,
                policySnapshotJson: {
                  source: "event_cancelled",
                  fullRefund: true,
                  actualPaidPence: paid,
                  refundableAmountPence,
                },
              },
            })
          : await tx.retreatCancellationRequest.create({
              data: {
                bookingId: booking.id,
                requestedByUserId: input.actorUserId,
                requestedByEmail: actor.email,
                reason,
                source: RetreatCancellationSource.event_cancelled,
                refundableAmountPence,
                policySnapshotJson: {
                  source: "event_cancelled",
                  fullRefund: true,
                  actualPaidPence: paid,
                  refundableAmountPence,
                },
              },
            });
      if (PAID_STATUSES.includes(booking.paymentStatus)) {
        bookingRequestIds.push(request.id);
      } else {
        await tx.retreatBooking.update({
          where: { id: booking.id },
          data: { bookingStatus: RetreatBookingStatus.cancelled, cancelledAt: new Date() },
        });
        await tx.retreatBookingInstalment.updateMany({
          where: { bookingId: booking.id, status: "pending" },
          data: { status: "cancelled" },
        });
      }
    }

    const giftRequestIds: string[] = [];
    for (const gift of retreatDate.giftPurchases) {
      const refundableAmountPence =
        gift.status === GiftPurchaseStatus.purchased
          ? Math.max(gift.totalPaidPence - gift.refundedAmountPence, 0)
          : 0;
      const latest = gift.cancellationRequests[0];
      const request =
        latest && ["requested", "failed"].includes(latest.status)
          ? await tx.giftCancellationRequest.update({
              where: { id: latest.id },
              data: {
                source: RetreatCancellationSource.event_cancelled,
                status: RetreatCancellationStatus.requested,
                refundableAmountPence,
                reason,
                policySnapshotJson: {
                  source: "event_cancelled",
                  fullRefund: true,
                  actualPaidPence: refundableAmountPence,
                  refundableAmountPence,
                },
              },
            })
          : await tx.giftCancellationRequest.create({
              data: {
                giftPurchaseId: gift.id,
                requestedByUserId: input.actorUserId,
                requestedByEmail: actor.email,
                reason,
                source: RetreatCancellationSource.event_cancelled,
                refundableAmountPence,
                policySnapshotJson: {
                  source: "event_cancelled",
                  fullRefund: true,
                  actualPaidPence: refundableAmountPence,
                  refundableAmountPence,
                },
              },
            });
      if (gift.status === GiftPurchaseStatus.purchased) {
        giftRequestIds.push(request.id);
      } else {
        await tx.giftPurchase.update({
          where: { id: gift.id },
          data: { status: GiftPurchaseStatus.cancelled },
        });
      }
    }

    await tx.retreatOnlineAccessEntitlement.updateMany({
      where: { retreatDateId: retreatDate.id },
      data: { liveAccessEnabled: false, replayAccessEnabled: false },
    });
    await tx.replayEntitlement.updateMany({
      where: { replayAsset: { retreatDateId: retreatDate.id } },
      data: { revokedAt: new Date(), revokedByUserId: input.actorUserId },
    });
    await tx.retreatDate.update({
      where: { id: retreatDate.id },
      data: {
        status: "cancelled",
        replayAvailable: false,
        liveRoomState: "ended",
        liveEndedAt: new Date(),
      },
    });

    return {
      retreatDate,
      bookingRequestIds,
      giftRequestIds,
      checkoutSessionIds: [
        ...retreatDate.bookings.flatMap((booking) => [
          booking.stripeDepositSessionId,
          booking.stripeBalanceSessionId,
          ...booking.instalments
            .filter((instalment) => instalment.status === "pending")
            .map((instalment) => instalment.stripeCheckoutSessionId),
        ]),
        ...retreatDate.giftPurchases.map((gift) => gift.stripeCheckoutSessionId),
      ].filter((sessionId): sessionId is string => Boolean(sessionId)),
    };
  });

  const stripe = getStripeClient();
  await Promise.allSettled(
    prepared.checkoutSessionIds.map((sessionId) => stripe.checkout.sessions.expire(sessionId))
  );

  if (
    prepared.retreatDate.liveRecordingState === "recording" &&
    prepared.retreatDate.dailyRoomName
  ) {
    await stopRoomRecording(prepared.retreatDate.dailyRoomName).catch(async (error) => {
      console.error("Failed to stop recording for cancelled workshop", error);
      await db.retreatDate.update({
        where: { id: prepared.retreatDate.id },
        data: { liveRecordingState: "failed" },
      });
    });
  }

  const notifications: Promise<unknown>[] = [];
  for (const booking of prepared.retreatDate.bookings) {
    notifications.push(
      sendPostmarkReactEmail({
        to: booking.purchaserEmail,
        subject: `${prepared.retreatDate.retreatTitleSnapshot} has been cancelled`,
        react: WorkshopCancelledEmail({
          firstName: booking.purchaserFirstName,
          workshopName: prepared.retreatDate.retreatTitleSnapshot,
          purchaser: true,
          refundExpected: PAID_STATUSES.includes(booking.paymentStatus),
          supportUrl: buildAbsoluteUrl("/contact"),
        }),
        textBody: `${prepared.retreatDate.retreatTitleSnapshot} has been cancelled. ${PAID_STATUSES.includes(booking.paymentStatus) ? "A full refund is being submitted." : "Your checkout has been closed and no payment is due."}`,
        tag: "retreat-event-cancelled-purchaser",
        templateKey: "retreat-event-cancelled-purchaser",
        metadata: { bookingId: booking.id, retreatDateId: prepared.retreatDate.id },
        dispatchMode: "immediate_best_effort",
      })
    );
    const attendeeRecipients = booking.attendees?.length
      ? booking.attendees.map((attendee) => ({
          email: attendee.email,
          firstName: attendee.firstName,
          attendeeId: attendee.id,
        }))
      : [
          {
            email: booking.attendeeEmail,
            firstName: booking.attendeeFirstName,
            attendeeId: null,
          },
        ];
    for (const attendee of attendeeRecipients.filter(
      (recipient, index, recipients) =>
        recipient.email.toLowerCase() !== booking.purchaserEmail.toLowerCase() &&
        recipients.findIndex(
          (candidate) => candidate.email.toLowerCase() === recipient.email.toLowerCase()
        ) === index
    )) {
      notifications.push(
        sendPostmarkReactEmail({
          to: attendee.email,
          subject: `${prepared.retreatDate.retreatTitleSnapshot} has been cancelled`,
          react: WorkshopCancelledEmail({
            firstName: attendee.firstName,
            workshopName: prepared.retreatDate.retreatTitleSnapshot,
            purchaser: false,
            supportUrl: buildAbsoluteUrl("/contact"),
          }),
          textBody: `${prepared.retreatDate.retreatTitleSnapshot} has been cancelled. The purchaser will receive refund updates.`,
          tag: "retreat-event-cancelled-attendee",
          templateKey: "retreat-event-cancelled-attendee",
          metadata: {
            bookingId: booking.id,
            retreatDateId: prepared.retreatDate.id,
            attendeeId: attendee.attendeeId,
          },
          dispatchMode: "immediate_best_effort",
        })
      );
    }
  }
  for (const gift of prepared.retreatDate.giftPurchases) {
    notifications.push(
      sendPostmarkReactEmail({
        to: gift.purchaserEmail,
        subject: `${prepared.retreatDate.retreatTitleSnapshot} has been cancelled`,
        react: WorkshopCancelledEmail({
          firstName: gift.purchaserFirstName,
          workshopName: prepared.retreatDate.retreatTitleSnapshot,
          purchaser: true,
          refundExpected: gift.status === GiftPurchaseStatus.purchased,
          supportUrl: buildAbsoluteUrl("/contact"),
        }),
        textBody: `${prepared.retreatDate.retreatTitleSnapshot} has been cancelled. ${gift.status === GiftPurchaseStatus.purchased ? "A full refund is being submitted." : "Your checkout has been closed and no payment is due."}`,
        tag: "retreat-event-cancelled-gift-purchaser",
        templateKey: "retreat-event-cancelled-gift-purchaser",
        metadata: { giftPurchaseId: gift.id, retreatDateId: prepared.retreatDate.id },
        dispatchMode: "immediate_best_effort",
      })
    );
    notifications.push(
      sendPostmarkReactEmail({
        to: gift.recipientEmail,
        subject: `${prepared.retreatDate.retreatTitleSnapshot} has been cancelled`,
        react: WorkshopCancelledEmail({
          firstName: gift.recipientFirstName,
          workshopName: prepared.retreatDate.retreatTitleSnapshot,
          purchaser: false,
          supportUrl: buildAbsoluteUrl("/contact"),
        }),
        textBody: `${prepared.retreatDate.retreatTitleSnapshot} has been cancelled. The purchaser will receive refund updates.`,
        tag: "retreat-event-cancelled-gift-recipient",
        templateKey: "retreat-event-cancelled-gift-recipient",
        metadata: { giftPurchaseId: gift.id, retreatDateId: prepared.retreatDate.id },
        dispatchMode: "immediate_best_effort",
      })
    );
  }
  await Promise.allSettled(notifications);

  const refundWork = [
    ...prepared.bookingRequestIds.map((requestId) =>
      approveRetreatCancellation({ requestId, actorUserId: input.actorUserId, reason })
    ),
    ...prepared.giftRequestIds.map((requestId) =>
      approveGiftCancellation({ requestId, actorUserId: input.actorUserId, reason })
    ),
  ];
  const refundResults = await Promise.allSettled(refundWork.slice(0, 10));
  const failedRefunds = refundResults.filter((result) => result.status === "rejected").length;
  await createAdminActionLog({
    actorUserId: input.actorUserId,
    actionType: "retreat_event_cancelled",
    targetType: "retreat_date",
    targetId: input.retreatDateId,
    reason,
    metadataJson: {
      bookingRefunds: prepared.bookingRequestIds.length,
      giftRefunds: prepared.giftRequestIds.length,
      failedRefunds,
    },
  });
  return {
    status: "cancelled" as const,
    refundsQueued: refundWork.length,
    failedRefunds,
  };
}

export async function retryPendingEventCancellationRefunds(limit = 10) {
  const [bookingRequests, giftRequests] = await Promise.all([
    db.retreatCancellationRequest.findMany({
      where: {
        source: RetreatCancellationSource.event_cancelled,
        status: { in: [RetreatCancellationStatus.requested, RetreatCancellationStatus.failed] },
      },
      orderBy: { requestedAt: "asc" },
      take: limit,
    }),
    db.giftCancellationRequest.findMany({
      where: {
        source: RetreatCancellationSource.event_cancelled,
        status: { in: [RetreatCancellationStatus.requested, RetreatCancellationStatus.failed] },
      },
      orderBy: { requestedAt: "asc" },
      take: limit,
    }),
  ]);
  const work = [
    ...bookingRequests.map((request) =>
      approveRetreatCancellation({
        requestId: request.id,
        actorUserId: request.reviewedByUserId || request.requestedByUserId!,
        reason: request.reason,
      })
    ),
    ...giftRequests.map((request) =>
      approveGiftCancellation({
        requestId: request.id,
        actorUserId: request.reviewedByUserId || request.requestedByUserId!,
        reason: request.reason,
      })
    ),
  ];
  const results = await Promise.allSettled(work.slice(0, limit));
  return {
    processed: results.length,
    succeeded: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  };
}
