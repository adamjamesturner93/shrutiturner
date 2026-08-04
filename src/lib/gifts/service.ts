import {
  AcceptanceType,
  GiftPurchaseStatus,
  RetreatBookingStatus,
  RetreatPaymentStatus,
} from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import {
  assignRoomUnitAfterPayment,
  ensureRetreatOnlineAccessEntitlement,
} from "@/lib/retreats/service";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { assertNoResourceDisputeHold } from "@/lib/billing/dispute-service";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";
import GiftRedemptionEmail from "@/emails/gift-redemption";
import RetreatBookingAdminEmail from "@/emails/retreat-booking-admin";
import RetreatGiftRefundEmail from "@/emails/retreat-gift-refund";
import { assertCurrentAcceptances } from "@/lib/legal/acceptance-service";
import { getAdminEmailAllowlist } from "@/lib/env";
import { calculateRetreatRefund } from "@/lib/retreats/pricing";
import { createAdminActionLog } from "@/lib/admin/action-log-service";

export type PublicGiftRedemptionState =
  | { state: "invalid"; gift: null }
  | { state: "expired"; gift: null }
  | {
      state: "pending_payment" | "available" | "redeemed";
      gift: {
        id: string;
        code: string;
        type: "retreat" | "small_group";
        status: GiftPurchaseStatus;
        productTitle: string;
        purchaserName: string;
        recipientName: string;
        recipientMessage: string | null;
        redemptionUrl: string;
        redeemedAt: string | null;
        retreat: null | {
          retreatSlug: string;
          retreatTitle: string;
          roomLabel: string;
          startDate: string;
          endDate: string;
          guestsIncluded: number;
        };
        programme: null | {
          templateSlug: string;
          runSlug: string;
          programmeTitle: string;
          startDate: string | null;
          scheduleLabel: string | null;
        };
      };
    };

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeText(value: string, max: number) {
  return value.trim().slice(0, max);
}

async function lockGiftPurchase(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  giftPurchaseId: string
) {
  await tx.$queryRaw`
    SELECT pg_advisory_xact_lock(hashtext(${`gift-purchase:${giftPurchaseId}`})) IS NULL AS "acquired"
  `;
}

function formatCurrency(pence: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(pence / 100);
}

function formatDateRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

async function sendRetreatGiftAdminNotification(giftId: string) {
  const gift = await db.giftPurchase.findUnique({
    where: { id: giftId },
    include: { retreatDate: true, retreatRoomOption: true },
  });
  if (!gift?.retreatDate) return;

  const adminUrl = buildAbsoluteUrl(`/admin/retreats/${gift.retreatDate.id}`);
  await Promise.allSettled(
    getAdminEmailAllowlist().map((email) =>
      sendPostmarkReactEmail({
        to: email,
        subject: `New retreat gift: ${gift.retreatDate!.retreatTitleSnapshot}`,
        react: RetreatBookingAdminEmail({
          purchaserName: `${gift.purchaserFirstName} ${gift.purchaserLastName}`.trim(),
          purchaserEmail: gift.purchaserEmail,
          retreatName: gift.retreatDate!.retreatTitleSnapshot,
          retreatDates: formatDateRange(gift.retreatDate!.startsAt, gift.retreatDate!.endsAt),
          selection: gift.retreatRoomOption?.label || "Retreat place",
          guestCount: gift.retreatGuestCount || 1,
          paymentSummary: `${formatCurrency(gift.totalPaidPence, gift.currency)} received in full.`,
          adminUrl,
          isGift: true,
          recipientEmail: gift.recipientEmail,
        }),
        textBody: `New gift purchase for ${gift.retreatDate!.retreatTitleSnapshot}\nPurchaser: ${gift.purchaserFirstName} ${gift.purchaserLastName} (${gift.purchaserEmail})\nRecipient: ${gift.recipientEmail}\nSelection: ${gift.retreatRoomOption?.label || "Retreat place"}\nPaid: ${formatCurrency(gift.totalPaidPence, gift.currency)}\nOpen: ${adminUrl}`,
        tag: "retreat-gift-admin",
        templateKey: "retreat-gift-admin",
        metadata: { giftPurchaseId: gift.id, retreatDateId: gift.retreatDate!.id },
        dispatchMode: "immediate_best_effort",
      })
    )
  );
}

async function sendGiftDeliveryEmail(giftId: string) {
  const gift = await db.giftPurchase.findUnique({
    where: { id: giftId },
  });
  if (!gift || gift.deliveryEmailSentAt) return;

  const redemptionUrl = buildAbsoluteUrl(`/gift/redeem/${gift.code}`);
  const to = gift.deliveryTarget === "recipient" ? gift.recipientEmail : gift.purchaserEmail;

  await sendPostmarkReactEmail({
    to,
    subject:
      gift.deliveryTarget === "recipient"
        ? `${gift.purchaserFirstName} sent you a gift`
        : `Your gift link for ${gift.productTitleSnapshot}`,
    react: GiftRedemptionEmail({
      recipientName: `${gift.recipientFirstName} ${gift.recipientLastName}`.trim(),
      purchaserName: `${gift.purchaserFirstName} ${gift.purchaserLastName}`.trim(),
      productTitle: gift.productTitleSnapshot,
      giftMessage: gift.recipientMessage,
      redemptionUrl,
      sendToBuyer: gift.deliveryTarget === "buyer",
    }),
    textBody:
      gift.deliveryTarget === "recipient"
        ? `${gift.purchaserFirstName} ${gift.purchaserLastName} has sent you a gift for ${gift.productTitleSnapshot}.\nRedeem it here: ${redemptionUrl}`
        : `Your gift link for ${gift.productTitleSnapshot} is ready.\nOpen it here: ${redemptionUrl}`,
    tag: "gift-delivery",
    templateKey: "gift-delivery",
    metadata: {
      giftPurchaseId: gift.id,
      giftType: gift.type,
      code: gift.code,
    },
    dispatchMode: "immediate_best_effort",
  });
  await db.giftPurchase.updateMany({
    where: { id: gift.id, deliveryEmailSentAt: null },
    data: { deliveryEmailSentAt: new Date() },
  });
}

export async function processGiftPurchaseCheckoutCompleted(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;
  if (kind !== "retreat_gift" && kind !== "small_group_gift") {
    return false;
  }

  const giftPurchaseId = session.metadata?.giftPurchaseId;
  if (!giftPurchaseId) return false;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const gift = await db.giftPurchase.findUnique({
    where: { id: giftPurchaseId },
    select: { id: true, status: true, deliveryEmailSentAt: true },
  });
  if (!gift) return false;

  const purchaseCompletedNow = gift.status !== GiftPurchaseStatus.purchased;
  if (purchaseCompletedNow) {
    await db.giftPurchase.update({
      where: { id: giftPurchaseId },
      data: {
        status: GiftPurchaseStatus.purchased,
        purchasedAt: new Date(),
        stripePaymentIntentId: paymentIntentId || undefined,
        expiresAt: null,
      },
    });
  }

  if (!gift.deliveryEmailSentAt) {
    await sendGiftDeliveryEmail(giftPurchaseId).catch((error) => {
      console.error("Failed to send gift delivery email", error);
    });
  }

  if (kind === "retreat_gift" && purchaseCompletedNow) {
    await sendRetreatGiftAdminNotification(giftPurchaseId).catch((error) => {
      console.error("Failed to send retreat gift admin notification", error);
    });
  }

  return true;
}

export async function getGiftRedemptionState(code: string): Promise<PublicGiftRedemptionState> {
  const gift = await db.giftPurchase.findUnique({
    where: { code },
    include: {
      retreatDate: true,
      retreatRoomOption: true,
      smallGroupProgramme: true,
      retreatBooking: true,
      enrolment: true,
    },
  });

  if (!gift) return { state: "invalid", gift: null };

  const now = new Date();
  if (
    gift.status === GiftPurchaseStatus.expired ||
    gift.status === GiftPurchaseStatus.cancelled ||
    gift.status === GiftPurchaseStatus.refunded ||
    (gift.expiresAt && gift.expiresAt < now && gift.status !== GiftPurchaseStatus.redeemed)
  ) {
    return { state: "expired", gift: null };
  }

  const redemptionState =
    gift.status === GiftPurchaseStatus.redeemed
      ? "redeemed"
      : gift.status === GiftPurchaseStatus.pending_payment
        ? "pending_payment"
        : "available";

  return {
    state: redemptionState,
    gift: {
      id: gift.id,
      code: gift.code,
      type: gift.type,
      status: gift.status,
      productTitle: gift.productTitleSnapshot,
      purchaserName: `${gift.purchaserFirstName} ${gift.purchaserLastName}`.trim(),
      recipientName: `${gift.recipientFirstName} ${gift.recipientLastName}`.trim(),
      recipientMessage: gift.recipientMessage,
      redemptionUrl: buildAbsoluteUrl(`/gift/redeem/${gift.code}`),
      redeemedAt: gift.redeemedAt?.toISOString() || null,
      retreat:
        gift.type === "retreat" && gift.retreatDate && gift.retreatRoomOption
          ? {
              retreatSlug: gift.retreatDate.retreatSlug,
              retreatTitle: gift.retreatDate.retreatTitleSnapshot,
              roomLabel: gift.retreatRoomOption.label,
              startDate: gift.retreatDate.startsAt.toISOString(),
              endDate: gift.retreatDate.endsAt.toISOString(),
              guestsIncluded: gift.retreatGuestCount ?? gift.retreatRoomOption.guestsIncluded,
            }
          : null,
      programme:
        gift.type === "small_group" && gift.smallGroupProgramme
          ? {
              templateSlug: gift.smallGroupProgramme.templateSlug,
              runSlug: gift.smallGroupProgramme.runSlug,
              programmeTitle: gift.smallGroupProgramme.title,
              startDate: gift.smallGroupProgramme.startDate?.toISOString() || null,
              scheduleLabel: gift.smallGroupProgramme.scheduleLabel,
            }
          : null,
    },
  };
}

export async function refundUnredeemedRetreatGift(input: {
  retreatDateId: string;
  giftPurchaseId: string;
  actorUserId: string;
}) {
  const gift = await db.giftPurchase.findFirst({
    where: {
      id: input.giftPurchaseId,
      retreatDateId: input.retreatDateId,
      type: "retreat",
    },
    include: { retreatDate: true, retreatBooking: true },
  });
  if (!gift?.retreatDate) throw new Error("NOT_FOUND");
  if (gift.retreatBooking || gift.status === GiftPurchaseStatus.redeemed) {
    throw new Error("GIFT_ALREADY_REDEEMED");
  }
  if (gift.status === GiftPurchaseStatus.refunded) return gift;
  if (
    gift.status !== GiftPurchaseStatus.purchased &&
    !(gift.status === GiftPurchaseStatus.cancelled && !gift.stripeRefundId)
  ) {
    throw new Error("GIFT_NOT_REFUNDABLE");
  }
  if (!gift.stripePaymentIntentId && gift.totalPaidPence > 0) {
    throw new Error("GIFT_PAYMENT_INTENT_MISSING");
  }

  const refundableAmountPence = calculateRetreatRefund({
    actualPaidPence: Math.max(gift.totalPaidPence - gift.refundedAmountPence, 0),
    nonRefundableAmountPence: Math.min(gift.nonRefundableAmountPence, gift.totalPaidPence),
    startsAt: gift.retreatDate.startsAt,
    requestedAt: new Date(),
    retreatType: gift.retreatDate.retreatType === "online" ? "online" : "in_person",
  });

  await db.giftPurchase.update({
    where: { id: gift.id },
    data: { status: GiftPurchaseStatus.cancelled },
  });

  try {
    const stripeRefund =
      refundableAmountPence > 0
        ? await getStripeClient().refunds.create(
            {
              payment_intent: gift.stripePaymentIntentId!,
              amount: refundableAmountPence,
              reason: "requested_by_customer",
              metadata: {
                giftPurchaseId: gift.id,
                retreatDateId: gift.retreatDate.id,
              },
            },
            { idempotencyKey: `retreat-gift-refund-${gift.id}` }
          )
        : null;

    const updated = await db.giftPurchase.update({
      where: { id: gift.id },
      data: {
        status: GiftPurchaseStatus.refunded,
        refundedAmountPence: refundableAmountPence,
        stripeRefundId: stripeRefund?.id || null,
        refundedAt: new Date(),
      },
    });
    await Promise.allSettled([
      sendPostmarkReactEmail({
        to: gift.purchaserEmail,
        subject: `${gift.retreatDate.retreatTitleSnapshot}: gift purchase cancelled`,
        react: RetreatGiftRefundEmail({
          firstName: gift.purchaserFirstName,
          retreatName: gift.retreatDate.retreatTitleSnapshot,
          refundAmount: formatCurrency(refundableAmountPence, gift.currency),
        }),
        textBody: `Your unredeemed gift purchase for ${gift.retreatDate.retreatTitleSnapshot} has been cancelled. Refund submitted: ${formatCurrency(refundableAmountPence, gift.currency)}.`,
        tag: "retreat-gift-refund",
        templateKey: "retreat-gift-refund",
        metadata: { giftPurchaseId: gift.id, retreatDateId: gift.retreatDate.id },
        dispatchMode: "immediate_best_effort",
      }),
      createAdminActionLog({
        actorUserId: input.actorUserId,
        actionType: "retreat_gift_refunded",
        targetType: "gift_purchase",
        targetId: gift.id,
        metadataJson: { refundableAmountPence, stripeRefundId: stripeRefund?.id || null },
      }),
    ]);
    return updated;
  } catch (error) {
    await db.giftPurchase.updateMany({
      where: { id: gift.id, status: GiftPurchaseStatus.cancelled, stripeRefundId: null },
      data: { status: GiftPurchaseStatus.purchased },
    });
    throw error;
  }
}

export async function getMyRetreatGiftPurchases(userId: string) {
  const gifts = await db.giftPurchase.findMany({
    where: {
      purchaserUserId: userId,
      type: "retreat",
    },
    include: {
      retreatDate: true,
      retreatRoomOption: true,
    },
    orderBy: [{ retreatDate: { startsAt: "asc" } }, { createdAt: "desc" }],
  });

  return gifts.flatMap((gift) =>
    gift.retreatDate
      ? [
          {
            id: gift.id,
            retreatSlug: gift.retreatDate.retreatSlug,
            retreatTitle: gift.retreatDate.retreatTitleSnapshot,
            location: gift.retreatDate.retreatLocationSnapshot,
            startsAt: gift.retreatDate.startsAt.toISOString(),
            endsAt: gift.retreatDate.endsAt.toISOString(),
            recipientName: `${gift.recipientFirstName} ${gift.recipientLastName}`.trim(),
            recipientEmail: gift.recipientEmail,
            roomType: gift.retreatRoomOption?.label || null,
            guestCount: gift.retreatGuestCount || 1,
            status: gift.status,
            totalPaidPence: gift.totalPaidPence,
            refundedAmountPence: gift.refundedAmountPence,
            purchasedAt: gift.purchasedAt?.toISOString() || null,
            deliveredAt: gift.deliveryEmailSentAt?.toISOString() || null,
            redeemedAt: gift.redeemedAt?.toISOString() || null,
          },
        ]
      : []
  );
}

export async function redeemGiftPurchase(input: {
  code: string;
  userId: string;
  attendeeFirstName?: string;
  attendeeLastName?: string;
  attendeeEmail?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dietaryRequirements?: string;
  medicalConditions?: string;
  mobilityNeeds?: string;
  guestTwoFirstName?: string;
  guestTwoLastName?: string;
  guestTwoEmail?: string;
  guestTwoDietaryRequirements?: string;
}) {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  const gift = await db.giftPurchase.findUnique({
    where: { code: input.code },
    include: {
      retreatDate: true,
      retreatRoomOption: true,
      smallGroupProgramme: true,
      retreatBooking: true,
      enrolment: true,
    },
  });
  if (!gift) throw new Error("INVALID_GIFT");
  if (gift.status === GiftPurchaseStatus.redeemed) throw new Error("ALREADY_REDEEMED");
  if (gift.status !== GiftPurchaseStatus.purchased) throw new Error("GIFT_NOT_READY");
  if (gift.expiresAt && gift.expiresAt < new Date()) throw new Error("GIFT_EXPIRED");
  await assertNoResourceDisputeHold("gift_purchase", gift.id);

  const attendeeFirstName = normalizeText(
    input.attendeeFirstName || user.firstName || gift.recipientFirstName,
    80
  );
  const attendeeLastName = normalizeText(
    input.attendeeLastName || user.lastName || gift.recipientLastName,
    80
  );
  const attendeeEmail = normalizeEmail(input.attendeeEmail || user.email || gift.recipientEmail);

  if (!attendeeFirstName || !attendeeLastName || !attendeeEmail) {
    throw new Error("ATTENDEE_REQUIRED");
  }

  if (gift.type === "retreat") {
    if (!gift.retreatDate || !gift.retreatRoomOption) {
      throw new Error("INVALID_GIFT");
    }
    const retreatGuestCount = Math.max(
      gift.retreatGuestCount ?? gift.retreatRoomOption.guestsIncluded,
      1
    );
    await assertCurrentAcceptances(user.id, [
      { type: AcceptanceType.terms, surface: "retreat_gift_redemption" },
      { type: AcceptanceType.health_waiver, surface: "retreat_gift_redemption" },
      { type: AcceptanceType.health_data, surface: "retreat_gift_redemption" },
    ]);

    const booking = await db.$transaction(async (tx) => {
      await lockGiftPurchase(tx, gift.id);
      const currentGift = await tx.giftPurchase.findUnique({
        where: { id: gift.id },
        select: { status: true },
      });
      if (!currentGift) throw new Error("INVALID_GIFT");
      if (currentGift.status === GiftPurchaseStatus.redeemed) {
        throw new Error("ALREADY_REDEEMED");
      }
      if (currentGift.status !== GiftPurchaseStatus.purchased) {
        throw new Error("GIFT_NOT_READY");
      }
      const created = await tx.retreatBooking.create({
        data: {
          retreatDateId: gift.retreatDateId!,
          roomOptionId: gift.retreatRoomOptionId!,
          purchaserUserId: gift.purchaserUserId || undefined,
          attendeeUserId: user.id,
          purchaserFirstName: gift.purchaserFirstName,
          purchaserLastName: gift.purchaserLastName,
          purchaserEmail: gift.purchaserEmail,
          attendeeFirstName,
          attendeeLastName,
          attendeeEmail,
          phone: normalizeText(input.phone || "", 40),
          emergencyContactName: normalizeText(input.emergencyContactName || "", 120),
          emergencyContactPhone: normalizeText(input.emergencyContactPhone || "", 40),
          dietaryRequirements: normalizeText(input.dietaryRequirements || "", 1000) || null,
          medicalConditions: normalizeText(input.medicalConditions || "", 2000) || null,
          mobilityNeeds: normalizeText(input.mobilityNeeds || "", 1000) || null,
          guestTwoFirstName: normalizeText(input.guestTwoFirstName || "", 80) || null,
          guestTwoLastName: normalizeText(input.guestTwoLastName || "", 80) || null,
          guestTwoEmail: input.guestTwoEmail ? normalizeEmail(input.guestTwoEmail) : null,
          guestTwoDietaryRequirements:
            normalizeText(input.guestTwoDietaryRequirements || "", 1000) || null,
          singleRoomRequested: gift.retreatRoomOption.roomType === "single",
          roomType: gift.retreatRoomOption.label,
          roomOptionLabelSnapshot: gift.retreatRoomOption.label,
          roomOptionTypeSnapshot: gift.retreatRoomOption.roomType,
          attendeeCount: retreatGuestCount,
          guestsIncluded: retreatGuestCount,
          giftPurchaseId: gift.id,
          totalPricePence: gift.totalPaidPence,
          depositAmountPence: gift.totalPaidPence,
          balanceAmountPence: 0,
          depositPaidPence: gift.totalPaidPence,
          balancePaidPence: 0,
          currency: gift.currency,
          paymentStatus: RetreatPaymentStatus.paid_in_full,
          bookingStatus: RetreatBookingStatus.paid_in_full,
          bookedAt: gift.purchasedAt || new Date(),
          depositPaidAt: gift.purchasedAt || new Date(),
          attendees: {
            create: [
              {
                userId: user.id,
                email: attendeeEmail,
                firstName: attendeeFirstName,
                lastName: attendeeLastName,
                displayName: `${attendeeFirstName} ${attendeeLastName}`.trim(),
                isPrimary: true,
                isPurchaser: attendeeEmail === normalizeEmail(gift.purchaserEmail),
                status: "claimed",
                claimedAt: new Date(),
              },
              ...(retreatGuestCount > 1 && input.guestTwoEmail
                ? [
                    {
                      email: normalizeEmail(input.guestTwoEmail),
                      firstName: normalizeText(input.guestTwoFirstName || "", 80),
                      lastName: normalizeText(input.guestTwoLastName || "", 80),
                      displayName: `${normalizeText(
                        input.guestTwoFirstName || "",
                        80
                      )} ${normalizeText(input.guestTwoLastName || "", 80)}`.trim(),
                      isPrimary: false,
                      isPurchaser:
                        normalizeEmail(input.guestTwoEmail) === normalizeEmail(gift.purchaserEmail),
                    },
                  ]
                : []),
            ],
          },
          items: {
            create: {
              itemType:
                gift.retreatDate.retreatType === "online" ? "online_live_place" : "accommodation",
              inventoryPoolId: gift.retreatRoomOption.inventoryPoolId,
              roomOptionId: gift.retreatRoomOption.id,
              ratePlanId: gift.retreatRatePlanId,
              quantity: 1,
              guestCount: retreatGuestCount,
              unitPricePence: gift.totalPaidPence,
              totalPricePence: gift.totalPaidPence,
              currency: gift.currency,
            },
          },
        },
      });

      await tx.giftPurchase.update({
        where: { id: gift.id },
        data: {
          status: GiftPurchaseStatus.redeemed,
          redeemedByUserId: user.id,
          redeemedAt: new Date(),
        },
      });

      return created;
    });

    await assignRoomUnitAfterPayment(booking.id);
    await ensureRetreatOnlineAccessEntitlement(booking.id);
    return { type: "retreat" as const, bookingId: booking.id };
  }

  if (!gift.smallGroupProgrammeId || !gift.smallGroupProgramme) {
    throw new Error("INVALID_GIFT");
  }

  const enrolment = await db.$transaction(async (tx) => {
    await lockGiftPurchase(tx, gift.id);
    const currentGift = await tx.giftPurchase.findUnique({
      where: { id: gift.id },
      select: { status: true },
    });
    if (!currentGift) throw new Error("INVALID_GIFT");
    if (currentGift.status === GiftPurchaseStatus.redeemed) {
      throw new Error("ALREADY_REDEEMED");
    }
    if (currentGift.status !== GiftPurchaseStatus.purchased) {
      throw new Error("GIFT_NOT_READY");
    }
    const created = await tx.smallGroupProgrammeEnrollment.create({
      data: {
        programmeId: gift.smallGroupProgrammeId,
        userId: user.id,
        attendeeName: `${attendeeFirstName} ${attendeeLastName}`.trim(),
        attendeeEmail,
        status: "active",
        pricePaidPence: gift.totalPaidPence,
        currency: gift.currency,
        giftPurchaseId: gift.id,
      },
    });

    await tx.giftPurchase.update({
      where: { id: gift.id },
      data: {
        status: GiftPurchaseStatus.redeemed,
        redeemedByUserId: user.id,
        redeemedAt: new Date(),
      },
    });

    return created;
  });

  return { type: "small_group" as const, enrolmentId: enrolment.id };
}
