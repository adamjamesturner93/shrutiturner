import { GiftPurchaseStatus, RetreatBookingStatus, RetreatPaymentStatus } from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { buildAbsoluteUrl } from "@/lib/app-url";
import { assertNoResourceDisputeHold } from "@/lib/billing/dispute-service";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";
import GiftRedemptionEmail from "@/emails/gift-redemption";

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

async function sendGiftDeliveryEmail(giftId: string) {
  const gift = await db.giftPurchase.findUnique({
    where: { id: giftId },
  });
  if (!gift) return;

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
    select: { id: true, status: true },
  });
  if (!gift) return false;

  if (gift.status !== GiftPurchaseStatus.purchased) {
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

  await sendGiftDeliveryEmail(giftPurchaseId).catch((error) => {
    console.error("Failed to send gift delivery email", error);
  });

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
              guestsIncluded: gift.retreatRoomOption.guestsIncluded,
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
    if (
      gift.retreatRoomOption.guestsIncluded > 1 &&
      (!input.guestTwoFirstName?.trim() ||
        !input.guestTwoLastName?.trim() ||
        !input.guestTwoEmail?.trim())
    ) {
      throw new Error("SECOND_GUEST_REQUIRED");
    }

    const booking = await db.$transaction(async (tx) => {
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
          guestsIncluded: gift.retreatRoomOption.guestsIncluded,
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

    return { type: "retreat" as const, bookingId: booking.id };
  }

  if (!gift.smallGroupProgrammeId || !gift.smallGroupProgramme) {
    throw new Error("INVALID_GIFT");
  }

  const enrolment = await db.$transaction(async (tx) => {
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
