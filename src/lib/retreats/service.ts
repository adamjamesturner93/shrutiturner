import {
  AcceptanceType,
  ClassRoomSetupStatus,
  GiftPurchaseStatus,
  RetreatInstalmentKind,
  RetreatInstalmentStatus,
  RetreatBookingStatus,
  RetreatPaymentStatus,
  Prisma,
} from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { buildAbsoluteUrl, getBaseSiteUrl } from "@/lib/app-url";
import { getStripeClient } from "@/lib/billing/stripe-client";
import {
  assertNoResourceDisputeHold,
  assertNoUserCheckoutDisputeHold,
} from "@/lib/billing/dispute-service";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";
import {
  getRetreatBySlugCombined,
  getRetreatsCombined,
  type RetreatCombinedContent,
  type RetreatPaymentPlanContent,
} from "@/lib/content";
import { createSessionRoom, isDailyConfigured } from "@/lib/daily/service";
import { assertCurrentAcceptances } from "@/lib/legal/acceptance-service";
import { getCurrentPolicyVersions } from "@/lib/legal/policy-service";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";
import RetreatBalanceDueEmail from "@/emails/retreat-balance-due";
import RetreatBookingEmail from "@/emails/retreat-booking";
import {
  buildRetreatInstalmentPlan,
  calculatePayInFullDiscount,
  calculateRetreatNonRefundableAmount,
  type RetreatType,
} from "@/lib/retreats/pricing";

const RETREAT_PAYMENT_WINDOW_MS = 30 * 60 * 1000;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeText(value: string, max: number) {
  return value.trim().slice(0, max);
}

function parseIsoDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("INVALID_DATE");
  }
  return parsed;
}

function formatCurrency(pence: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(pence / 100);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatDateRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function createBalanceToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function createPaymentToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function parseRetreatType(value: string): RetreatType {
  return value === "online" ? "online" : "in_person";
}

function readPaymentPlanSnapshot(value: unknown): RetreatPaymentPlanContent | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const instalments = (value as { instalments?: unknown }).instalments;
  if (!Array.isArray(instalments)) return undefined;
  return value as RetreatPaymentPlanContent;
}

function toPrismaJson(value: unknown) {
  return value as Prisma.InputJsonValue | undefined;
}

function getDepositAmountPence(totalPricePence: number) {
  if (totalPricePence <= 25000) return totalPricePence;
  return Math.min(totalPricePence, 30000);
}

function getBalanceDueDate(startDate: Date) {
  return new Date(startDate.getTime() - 45 * 86400000);
}

async function createGuestAcceptanceEventsForRetreatPurchase(input: {
  purchaserEmail: string;
  surface: string;
  retreatBookingId?: string;
  giftPurchaseId?: string;
  retreatSlug: string;
  retreatDateId: string;
  roomOptionId: string;
  purchaseMode: "self" | "gift";
}) {
  const acceptanceTypes = [
    AcceptanceType.terms,
    AcceptanceType.health_waiver,
    AcceptanceType.health_data,
  ] as const;
  const policies = await getCurrentPolicyVersions([...acceptanceTypes]);
  const acceptedAt = new Date();

  await db.guestAcceptanceEvent.createMany({
    data: acceptanceTypes.map((type, index) => ({
      purchaserEmail: input.purchaserEmail,
      type,
      policyVersionId: policies[index]?.id,
      version: policies[index]?.version || "",
      acceptanceSurface: input.surface,
      acceptedAt,
      metadataJson: {
        purchaseMode: input.purchaseMode,
        retreatSlug: input.retreatSlug,
        retreatDateId: input.retreatDateId,
        roomOptionId: input.roomOptionId,
      },
      retreatBookingId: input.retreatBookingId,
      giftPurchaseId: input.giftPurchaseId,
    })),
  });
}

async function getOrCreateStripeCustomer(input: { userId: string; email: string; name: string }) {
  const existing = await db.user.findUnique({
    where: { id: input.userId },
    select: { stripeCustomerId: true },
  });
  if (!existing) throw new Error("USER_NOT_FOUND");
  if (existing.stripeCustomerId) return existing.stripeCustomerId;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: input.email,
    name: input.name,
    metadata: { userId: input.userId },
  });

  await db.user.update({
    where: { id: input.userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

async function getRetreatAndInstance(slug: string, externalDateId: string) {
  const retreat = await getRetreatBySlugCombined(slug);
  if (!retreat) throw new Error("RETREAT_NOT_FOUND");
  const instance = retreat.dates.find((date) => date.id === externalDateId);
  if (!instance) throw new Error("RETREAT_DATE_NOT_FOUND");
  return { retreat, instance };
}

function isEarlyBirdActive(retreat: RetreatCombinedContent) {
  return new Date() < parseIsoDate(retreat.earlyBirdDeadline);
}

async function getRoomAvailability(roomOptionId: string) {
  const now = new Date();
  const [bookings, giftCount, roomOption] = await Promise.all([
    db.retreatBooking.findMany({
      where: {
        roomOptionId,
        OR: [
          { bookingStatus: { in: ["deposit_paid", "balance_due", "paid_in_full"] } },
          {
            bookingStatus: "pending",
            createdAt: { gt: new Date(now.getTime() - RETREAT_PAYMENT_WINDOW_MS) },
          },
        ],
      },
      select: { attendeeCount: true, guestsIncluded: true },
    }),
    db.giftPurchase.count({
      where: {
        retreatRoomOptionId: roomOptionId,
        OR: [
          { status: GiftPurchaseStatus.purchased },
          {
            status: GiftPurchaseStatus.pending_payment,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
    }),
    db.retreatRoomOption.findUnique({
      where: { id: roomOptionId },
      select: { guestsIncluded: true },
    }),
  ]);
  const bookedAttendees = bookings.reduce(
    (sum, booking) => sum + Math.max(booking.attendeeCount || booking.guestsIncluded || 1, 1),
    0
  );
  return bookedAttendees + giftCount * Math.max(roomOption?.guestsIncluded || 1, 1);
}

export async function syncRetreatDateFromContent(slug: string, externalDateId: string) {
  const { retreat, instance } = await getRetreatAndInstance(slug, externalDateId);
  const startsAt = parseIsoDate(instance.startDate);
  const endsAt = parseIsoDate(instance.endDate);
  const earlyBird = isEarlyBirdActive(retreat);
  const basePricePence = (earlyBird ? retreat.earlyBirdPrice : retreat.normalPrice) * 100;
  const depositAmountPence = getDepositAmountPence(basePricePence);
  const balanceDueAt = getBalanceDueDate(startsAt);
  const retreatType = instance.retreatType || "in_person";
  const refundPolicySnapshot = {
    retreatType,
    refundNotes: instance.refundNotes || null,
    inPersonBalanceRefundCutoffDays: 56,
    onlineRefundCutoffDays: 14,
  };

  const retreatDate = await db.retreatDate.upsert({
    where: { externalDateId },
    create: {
      externalDateId,
      retreatSlug: retreat.slug,
      retreatTitleSnapshot: retreat.title,
      retreatLocationSnapshot: retreat.location,
      retreatType,
      timezone: instance.timezone || "Europe/London",
      startsAt,
      endsAt,
      capacity: instance.totalSpaces,
      status: instance.availableSpaces > 0 ? "open" : "sold_out",
      currency: retreat.currency,
      pricePence: basePricePence,
      depositAmountPence,
      singleRoomSupplementPence: 0,
      balanceDueAt,
      paymentPlanSnapshotJson: toPrismaJson(instance.paymentPlan),
      refundPolicySnapshotJson: refundPolicySnapshot,
      payInFullDiscountEnabled: instance.payInFullDiscountEnabled === true,
    },
    update: {
      retreatSlug: retreat.slug,
      retreatTitleSnapshot: retreat.title,
      retreatLocationSnapshot: retreat.location,
      retreatType,
      timezone: instance.timezone || "Europe/London",
      startsAt,
      endsAt,
      capacity: instance.totalSpaces,
      status: instance.availableSpaces > 0 ? "open" : "sold_out",
      currency: retreat.currency,
      pricePence: basePricePence,
      depositAmountPence,
      singleRoomSupplementPence: 0,
      balanceDueAt,
      paymentPlanSnapshotJson: toPrismaJson(instance.paymentPlan),
      refundPolicySnapshotJson: refundPolicySnapshot,
      payInFullDiscountEnabled: instance.payInFullDiscountEnabled === true,
    },
  });

  for (const roomOption of instance.roomOptions) {
    const roomPricePence = earlyBird
      ? (roomOption.earlyBirdPricePence ?? roomOption.normalPricePence)
      : roomOption.normalPricePence;
    const roomDepositPence = roomOption.depositPence ?? getDepositAmountPence(roomPricePence);
    const syncedRoomOption = await db.retreatRoomOption.upsert({
      where: {
        retreatDateId_externalRoomOptionId: {
          retreatDateId: retreatDate.id,
          externalRoomOptionId: roomOption.id,
        },
      },
      create: {
        retreatDateId: retreatDate.id,
        externalRoomOptionId: roomOption.id,
        label: roomOption.label,
        description: roomOption.description,
        roomType: roomOption.type,
        guestsIncluded: roomOption.guestsIncluded,
        capacity: roomOption.capacity,
        availableSpots: roomOption.availableSpots,
        pricePence: roomPricePence,
        pricePerPersonPence: roomOption.pricePerPersonPence ?? null,
        roomCount: roomOption.roomCount ?? 0,
        depositAmountPence: roomDepositPence,
        isWaitlistOnly: roomOption.isWaitlistOnly === true,
      },
      update: {
        label: roomOption.label,
        description: roomOption.description,
        roomType: roomOption.type,
        guestsIncluded: roomOption.guestsIncluded,
        capacity: roomOption.capacity,
        availableSpots: roomOption.availableSpots,
        pricePence: roomPricePence,
        pricePerPersonPence: roomOption.pricePerPersonPence ?? null,
        roomCount: roomOption.roomCount ?? 0,
        depositAmountPence: roomDepositPence,
        isWaitlistOnly: roomOption.isWaitlistOnly === true,
      },
    });

    const roomCount = Math.max(roomOption.roomCount ?? 0, 0);
    for (let index = 1; index <= roomCount; index += 1) {
      await db.retreatRoomUnit.upsert({
        where: {
          retreatDateId_label: {
            retreatDateId: retreatDate.id,
            label: `${roomOption.label} ${index}`,
          },
        },
        create: {
          retreatDateId: retreatDate.id,
          roomOptionId: syncedRoomOption.id,
          label: `${roomOption.label} ${index}`,
          capacity: Math.max(roomOption.guestsIncluded, 1),
        },
        update: {
          roomOptionId: syncedRoomOption.id,
          capacity: Math.max(roomOption.guestsIncluded, 1),
        },
      });
    }
  }

  return db.retreatDate.findUniqueOrThrow({
    where: { id: retreatDate.id },
    include: { roomOptions: true },
  });
}

async function getSyncedRetreatDateAndRoomOption(input: {
  retreatSlug: string;
  retreatDateId: string;
  roomOptionId: string;
}) {
  const retreatDate = await syncRetreatDateFromContent(input.retreatSlug, input.retreatDateId);
  if (retreatDate.status !== "open") {
    throw new Error("RETREAT_DATE_UNAVAILABLE");
  }

  const roomOption =
    retreatDate.roomOptions.find((item) => item.externalRoomOptionId === input.roomOptionId) ||
    null;
  if (!roomOption) {
    throw new Error("ROOM_OPTION_NOT_FOUND");
  }

  const reserved = await getRoomAvailability(roomOption.id);
  const availableSpots = Math.max(roomOption.capacity - reserved, 0);
  if (roomOption.isWaitlistOnly || availableSpots <= 0) {
    throw new Error("ROOM_OPTION_UNAVAILABLE");
  }

  return { retreatDate, roomOption, availableSpots };
}

export async function getOperationalRetreatBySlug(
  slug: string
): Promise<RetreatCombinedContent | null> {
  const retreat = await getRetreatBySlugCombined(slug);
  if (!retreat) return null;

  const dates = await Promise.all(
    retreat.dates.map(async (date) => {
      try {
        const synced = await syncRetreatDateFromContent(slug, date.id);
        const roomOptions = await Promise.all(
          synced.roomOptions.map(async (roomOption) => {
            const reserved = await getRoomAvailability(roomOption.id);
            return {
              id: roomOption.externalRoomOptionId,
              label: roomOption.label,
              description: roomOption.description || "",
              type: roomOption.roomType as "shared_twin" | "single" | "shared_private" | "virtual",
              guestsIncluded: roomOption.guestsIncluded,
              capacity: roomOption.capacity,
              availableSpots: Math.max(roomOption.capacity - reserved, 0),
              earlyBirdPricePence: undefined,
              normalPricePence: roomOption.pricePence,
              pricePerPersonPence: roomOption.pricePerPersonPence ?? undefined,
              roomCount: roomOption.roomCount,
              depositPence: roomOption.depositAmountPence ?? undefined,
              isWaitlistOnly: roomOption.isWaitlistOnly,
            };
          })
        );
        return {
          ...date,
          availableSpaces: roomOptions.reduce((sum, room) => sum + room.availableSpots, 0),
          totalSpaces: synced.capacity,
          roomOptions,
        };
      } catch {
        return date;
      }
    })
  );

  return { ...retreat, dates };
}

export async function listOperationalRetreats(): Promise<RetreatCombinedContent[]> {
  const retreats = await getRetreatsCombined();
  return Promise.all(
    retreats.map(async (retreat) => (await getOperationalRetreatBySlug(retreat.slug)) || retreat)
  );
}

export async function createRetreatCheckout(input: {
  retreatSlug: string;
  retreatDateId: string;
  roomOptionId: string;
  purchaseMode: "self" | "gift";
  paymentOption?: "deposit" | "pay_in_full";
  purchaserUserId?: string | null;
  purchaserFirstName: string;
  purchaserLastName: string;
  purchaserEmail: string;
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
  acceptedTermsVersion?: string | null;
  acceptedHealthWaiverVersion?: string | null;
  acceptedHealthDataVersion?: string | null;
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientEmail?: string;
  recipientMessage?: string;
  deliveryTarget?: "recipient" | "buyer";
}) {
  if (input.purchaserUserId) {
    await assertNoUserCheckoutDisputeHold(input.purchaserUserId);
  }

  const acceptanceStates = input.purchaserUserId
    ? await assertCurrentAcceptances(input.purchaserUserId, [
        { type: AcceptanceType.terms, surface: "retreat_checkout" },
        { type: AcceptanceType.health_waiver, surface: "retreat_checkout" },
        { type: AcceptanceType.health_data, surface: "retreat_checkout" },
      ])
    : null;

  if (!input.purchaserUserId) {
    if (
      input.acceptedTermsVersion !== CURRENT_TERMS_VERSION ||
      input.acceptedHealthWaiverVersion !== CURRENT_HEALTH_WAIVER_VERSION ||
      input.acceptedHealthDataVersion !== CURRENT_HEALTH_DATA_CONSENT_VERSION
    ) {
      throw new Error("RETREAT_LEGAL_ACCEPTANCE_REQUIRED");
    }
  }

  const { retreatDate, roomOption } = await getSyncedRetreatDateAndRoomOption({
    retreatSlug: input.retreatSlug,
    retreatDateId: input.retreatDateId,
    roomOptionId: input.roomOptionId,
  });

  const purchaserFirstName = normalizeText(input.purchaserFirstName, 80);
  const purchaserLastName = normalizeText(input.purchaserLastName, 80);
  const purchaserEmail = normalizeEmail(input.purchaserEmail);
  const purchaserName = `${purchaserFirstName} ${purchaserLastName}`.trim();
  const attendeeCount = Math.max(roomOption.guestsIncluded || 1, 1);
  const roomTotalPricePence =
    roomOption.pricePerPersonPence && roomOption.pricePerPersonPence > 0
      ? roomOption.pricePerPersonPence * attendeeCount
      : roomOption.pricePence;

  const stripe = getStripeClient();
  const customerId = input.purchaserUserId
    ? await getOrCreateStripeCustomer({
        userId: input.purchaserUserId,
        email: purchaserEmail,
        name: purchaserName,
      })
    : undefined;

  if (input.purchaseMode === "gift") {
    const recipientFirstName = normalizeText(input.recipientFirstName || "", 80);
    const recipientLastName = normalizeText(input.recipientLastName || "", 80);
    const recipientEmail = normalizeEmail(input.recipientEmail || "");
    if (!recipientFirstName || !recipientLastName || !recipientEmail) {
      throw new Error("RECIPIENT_REQUIRED");
    }

    const gift = await db.giftPurchase.create({
      data: {
        code: `GIFT-RT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        type: "retreat",
        status: GiftPurchaseStatus.pending_payment,
        purchaserUserId: input.purchaserUserId || undefined,
        purchaserFirstName,
        purchaserLastName,
        purchaserEmail,
        recipientFirstName,
        recipientLastName,
        recipientEmail,
        recipientMessage: normalizeText(input.recipientMessage || "", 1000) || null,
        deliveryTarget: input.deliveryTarget === "buyer" ? "buyer" : "recipient",
        productSlug: input.retreatSlug,
        productTitleSnapshot: `${retreatDate.retreatTitleSnapshot} - ${roomOption.label}`,
        currency: retreatDate.currency,
        totalPaidPence: roomTotalPricePence,
        retreatDateId: retreatDate.id,
        retreatRoomOptionId: roomOption.id,
        expiresAt: new Date(Date.now() + RETREAT_PAYMENT_WINDOW_MS),
      },
    });

    const successUrl = `${getBaseSiteUrl()}/retreats/${input.retreatSlug}/checkout?date=${input.retreatDateId}&gift=1&checkout=success`;
    const cancelUrl = `${getBaseSiteUrl()}/retreats/${input.retreatSlug}/checkout?date=${input.retreatDateId}&gift=1&checkout=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      customer_email: customerId ? undefined : purchaserEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: "auto",
      line_items: [
        {
          price_data: {
            currency: retreatDate.currency.toLowerCase(),
            product_data: {
              name: `${retreatDate.retreatTitleSnapshot} gift`,
              description: `${roomOption.label} · ${formatDateRange(
                retreatDate.startsAt,
                retreatDate.endsAt
              )}`,
            },
            unit_amount: roomTotalPricePence,
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: "retreat_gift",
        giftPurchaseId: gift.id,
        retreatSlug: input.retreatSlug,
        retreatDateId: retreatDate.externalDateId,
        roomOptionId: roomOption.externalRoomOptionId,
        userId: input.purchaserUserId || "",
      },
    });

    if (!session.url) throw new Error("STRIPE_CHECKOUT_URL_MISSING");

    await db.giftPurchase.update({
      where: { id: gift.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    if (!input.purchaserUserId) {
      await createGuestAcceptanceEventsForRetreatPurchase({
        purchaserEmail,
        surface: "retreat_gift_checkout_guest",
        giftPurchaseId: gift.id,
        retreatSlug: input.retreatSlug,
        retreatDateId: input.retreatDateId,
        roomOptionId: input.roomOptionId,
        purchaseMode: input.purchaseMode,
      });
    }

    return { giftPurchaseId: gift.id, checkoutUrl: session.url };
  }

  const attendeeFirstName = normalizeText(input.attendeeFirstName || input.purchaserFirstName, 80);
  const attendeeLastName = normalizeText(input.attendeeLastName || input.purchaserLastName, 80);
  const attendeeEmail = normalizeEmail(input.attendeeEmail || purchaserEmail);
  if (!attendeeFirstName || !attendeeLastName || !attendeeEmail) {
    throw new Error("ATTENDEE_REQUIRED");
  }

  if (
    roomOption.guestsIncluded > 1 &&
    (!input.guestTwoFirstName?.trim() ||
      !input.guestTwoLastName?.trim() ||
      !input.guestTwoEmail?.trim())
  ) {
    throw new Error("SECOND_GUEST_REQUIRED");
  }

  const payInFull = input.paymentOption === "pay_in_full";
  const payInFullDiscountPence = calculatePayInFullDiscount(
    roomTotalPricePence,
    payInFull && retreatDate.payInFullDiscountEnabled
  );
  const payableTotalPence = roomTotalPricePence - payInFullDiscountPence;
  const depositAmountPence = Math.min(
    roomOption.depositAmountPence || roomTotalPricePence,
    payableTotalPence
  );
  const paymentPlan = readPaymentPlanSnapshot(retreatDate.paymentPlanSnapshotJson);
  const instalmentDrafts = buildRetreatInstalmentPlan({
    totalPence: payableTotalPence,
    depositPence: depositAmountPence,
    startsAt: retreatDate.startsAt,
    paymentPlan,
    payInFull,
  });
  const initialInstalment = instalmentDrafts[0];
  if (!initialInstalment || initialInstalment.amountPence <= 0) {
    throw new Error("RETREAT_PAYMENT_PLAN_INVALID");
  }
  const balanceAmountPence = Math.max(
    0,
    instalmentDrafts.slice(1).reduce((sum, instalment) => sum + instalment.amountPence, 0)
  );
  const nonRefundableAmountPence = calculateRetreatNonRefundableAmount({
    retreatType: parseRetreatType(retreatDate.retreatType),
    totalPence: payableTotalPence,
    depositPence: depositAmountPence,
  });
  const roomUnit = await db.retreatRoomUnit.findFirst({
    where: {
      roomOptionId: roomOption.id,
      status: "available",
    },
    orderBy: { label: "asc" },
  });

  const booking = await db.retreatBooking.create({
    data: {
      retreatDateId: retreatDate.id,
      roomOptionId: roomOption.id,
      roomUnitId: roomUnit?.id,
      purchaserUserId: input.purchaserUserId || undefined,
      purchaserFirstName,
      purchaserLastName,
      purchaserEmail,
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
      singleRoomRequested: roomOption.roomType === "single",
      roomType: roomOption.label,
      roomOptionLabelSnapshot: roomOption.label,
      roomOptionTypeSnapshot: roomOption.roomType,
      guestsIncluded: roomOption.guestsIncluded,
      attendeeCount,
      acceptedTermsVersion: input.acceptedTermsVersion || null,
      acceptedHealthWaiverVersion: input.acceptedHealthWaiverVersion || null,
      acceptedHealthDataVersion: input.acceptedHealthDataVersion || null,
      complianceSnapshotJson:
        acceptanceStates || input.acceptedTermsVersion || input.acceptedHealthWaiverVersion
          ? {
              acceptanceStates:
                acceptanceStates?.map((state) => ({
                  type: state.type,
                  policyVersionId: state.policyVersionId,
                  acceptanceEventId: state.acceptanceEventId,
                  version: state.currentVersion,
                  surface: state.surface,
                })) || [],
              acceptedTermsVersion: input.acceptedTermsVersion || null,
              acceptedHealthWaiverVersion: input.acceptedHealthWaiverVersion || null,
              acceptedHealthDataVersion: input.acceptedHealthDataVersion || null,
              retreatDateId: retreatDate.id,
              roomOptionId: roomOption.id,
            }
          : undefined,
      totalPricePence: payableTotalPence,
      payInFullDiscountPence,
      nonRefundableAmountPence,
      depositAmountPence,
      balanceAmountPence,
      currency: retreatDate.currency,
      bookingStatus: "pending",
      paymentStatus: "unpaid",
      balancePaymentUrlToken: balanceAmountPence > 0 ? createBalanceToken() : null,
      balanceDueAt: retreatDate.balanceDueAt,
      paymentPlanSnapshotJson: toPrismaJson(paymentPlan),
      refundPolicySnapshotJson: retreatDate.refundPolicySnapshotJson || undefined,
      instalments: {
        create: instalmentDrafts.map((instalment) => ({
          sequence: instalment.sequence,
          kind: instalment.kind as RetreatInstalmentKind,
          label: instalment.label,
          amountPence: instalment.amountPence,
          dueAt: instalment.dueAt,
          publicPaymentToken: instalment.sequence > 1 ? createPaymentToken() : null,
        })),
      },
      attendees: {
        create: [
          {
            email: attendeeEmail,
            firstName: attendeeFirstName,
            lastName: attendeeLastName,
            displayName: `${attendeeFirstName} ${attendeeLastName}`.trim(),
            isPrimary: true,
            isPurchaser: attendeeEmail === purchaserEmail,
            userId:
              input.purchaserUserId && attendeeEmail === purchaserEmail
                ? input.purchaserUserId
                : undefined,
            status:
              input.purchaserUserId && attendeeEmail === purchaserEmail
                ? "claimed"
                : "pending_claim",
            claimToken:
              input.purchaserUserId && attendeeEmail === purchaserEmail
                ? null
                : createPaymentToken(),
            claimedAt:
              input.purchaserUserId && attendeeEmail === purchaserEmail ? new Date() : null,
          },
          ...(roomOption.guestsIncluded > 1 && input.guestTwoEmail
            ? [
                {
                  email: normalizeEmail(input.guestTwoEmail),
                  firstName: normalizeText(input.guestTwoFirstName || "", 80),
                  lastName: normalizeText(input.guestTwoLastName || "", 80),
                  displayName: `${normalizeText(input.guestTwoFirstName || "", 80)} ${normalizeText(
                    input.guestTwoLastName || "",
                    80
                  )}`.trim(),
                  isPrimary: false,
                  isPurchaser: normalizeEmail(input.guestTwoEmail) === purchaserEmail,
                  claimToken: createPaymentToken(),
                },
              ]
            : []),
        ],
      },
    },
    include: { retreatDate: true },
  });

  if (roomUnit) {
    await db.retreatRoomUnit.update({
      where: { id: roomUnit.id },
      data: { status: "assigned" },
    });
  }

  const successUrl = `${getBaseSiteUrl()}/retreats/${input.retreatSlug}/checkout?date=${input.retreatDateId}&booking=${booking.id}&checkout=success`;
  const cancelUrl = `${getBaseSiteUrl()}/retreats/${input.retreatSlug}/checkout?date=${input.retreatDateId}&checkout=cancelled`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    customer_email: customerId ? undefined : purchaserEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: "auto",
    line_items: [
      {
        price_data: {
          currency: retreatDate.currency.toLowerCase(),
          product_data: {
            name: `${retreatDate.retreatTitleSnapshot} ${initialInstalment.label.toLowerCase()}`,
            description: `${roomOption.label} · ${formatDateRange(
              retreatDate.startsAt,
              retreatDate.endsAt
            )}`,
          },
          unit_amount: initialInstalment.amountPence,
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: "retreat_instalment",
      bookingId: booking.id,
      instalmentSequence: String(initialInstalment.sequence),
      retreatSlug: input.retreatSlug,
      retreatDateId: retreatDate.externalDateId,
      roomOptionId: roomOption.externalRoomOptionId,
      userId: input.purchaserUserId || "",
    },
  });

  if (!session.url) {
    throw new Error("STRIPE_CHECKOUT_URL_MISSING");
  }

  await db.retreatBooking.update({
    where: { id: booking.id },
    data: {
      stripeDepositSessionId: session.id,
      instalments: {
        update: {
          where: {
            bookingId_sequence: {
              bookingId: booking.id,
              sequence: initialInstalment.sequence,
            },
          },
          data: { stripeCheckoutSessionId: session.id },
        },
      },
    },
  });

  if (!input.purchaserUserId) {
    await createGuestAcceptanceEventsForRetreatPurchase({
      purchaserEmail,
      surface: "retreat_checkout_guest",
      retreatBookingId: booking.id,
      retreatSlug: input.retreatSlug,
      retreatDateId: input.retreatDateId,
      roomOptionId: input.roomOptionId,
      purchaseMode: input.purchaseMode,
    });
  }

  return {
    bookingId: booking.id,
    checkoutUrl: session.url,
  };
}

async function sendDepositConfirmationEmail(bookingId: string) {
  const booking = await db.retreatBooking.findUnique({
    where: { id: bookingId },
    include: { retreatDate: true },
  });
  if (!booking) return;

  const retreatDetailsUrl = buildAbsoluteUrl(`/retreats/${booking.retreatDate.retreatSlug}`);
  await sendPostmarkReactEmail({
    to: booking.purchaserEmail,
    subject: `${booking.retreatDate.retreatTitleSnapshot}: deposit received`,
    react: RetreatBookingEmail({
      firstName: booking.purchaserFirstName,
      retreatName: booking.retreatDate.retreatTitleSnapshot,
      retreatDates: formatDateRange(booking.retreatDate.startsAt, booking.retreatDate.endsAt),
      retreatLocation: booking.retreatDate.retreatLocationSnapshot,
      depositAmount: formatCurrency(booking.depositAmountPence, booking.currency),
      totalPrice: formatCurrency(booking.totalPricePence, booking.currency),
      remainderAmount: formatCurrency(booking.balanceAmountPence, booking.currency),
      remainderDueDate: booking.balanceDueAt ? formatDate(booking.balanceDueAt) : "Before arrival",
      retreatDetailsUrl,
      transactionRef: booking.id,
    }),
    textBody: `Deposit received for ${booking.retreatDate.retreatTitleSnapshot}\nDates: ${formatDateRange(booking.retreatDate.startsAt, booking.retreatDate.endsAt)}\nDeposit paid: ${formatCurrency(booking.depositAmountPence, booking.currency)}\nRemaining balance: ${formatCurrency(booking.balanceAmountPence, booking.currency)}\nDetails: ${retreatDetailsUrl}`,
    tag: "retreat-deposit-confirmation",
    templateKey: "retreat-deposit-confirmation",
    metadata: {
      bookingId: booking.id,
      retreatSlug: booking.retreatDate.retreatSlug,
    },
    dispatchMode: "immediate_best_effort",
  });
}

function getNextPendingRetreatInstalment<
  T extends {
    sequence: number;
    status: RetreatInstalmentStatus;
  },
>(instalments: T[]) {
  return (
    instalments
      .filter(
        (instalment) =>
          instalment.status === RetreatInstalmentStatus.pending && instalment.sequence > 1
      )
      .sort((a, b) => a.sequence - b.sequence)[0] || null
  );
}

export async function sendRetreatBalanceDueEmails(input: {
  retreatDateId: string;
  mode?: "due" | "chaser";
}) {
  const retreatDate = await db.retreatDate.findUnique({
    where: { id: input.retreatDateId },
    include: {
      bookings: {
        where: {
          bookingStatus: {
            in: [RetreatBookingStatus.deposit_paid, RetreatBookingStatus.balance_due],
          },
          paymentStatus: {
            in: [RetreatPaymentStatus.deposit_paid, RetreatPaymentStatus.partially_paid],
          },
          balanceAmountPence: { gt: 0 },
          balancePaymentUrlToken: { not: null },
        },
        include: {
          instalments: {
            orderBy: { sequence: "asc" },
          },
        },
      },
    },
  });
  if (!retreatDate) throw new Error("NOT_FOUND");

  let sent = 0;
  let skipped = 0;
  const now = new Date();
  const mode = input.mode === "chaser" ? "chaser" : "due";

  for (const booking of retreatDate.bookings) {
    const nextInstalment = getNextPendingRetreatInstalment(booking.instalments);
    const amountPence = nextInstalment?.amountPence || booking.balanceAmountPence;
    const dueAt = nextInstalment?.dueAt || booking.balanceDueAt;
    const token = booking.balancePaymentUrlToken;

    if (!token || amountPence <= 0) {
      skipped += 1;
      continue;
    }

    const paymentUrl = buildAbsoluteUrl(`/retreats/balance/${token}`);
    await sendPostmarkReactEmail({
      to: booking.purchaserEmail,
      subject:
        mode === "chaser"
          ? `Reminder: ${retreatDate.retreatTitleSnapshot} balance`
          : `${retreatDate.retreatTitleSnapshot}: balance due`,
      react: RetreatBalanceDueEmail({
        firstName: booking.purchaserFirstName,
        retreatName: retreatDate.retreatTitleSnapshot,
        retreatDates: formatDateRange(retreatDate.startsAt, retreatDate.endsAt),
        balanceAmount: formatCurrency(amountPence, booking.currency),
        dueDate: dueAt ? formatDate(dueAt) : "Before arrival",
        paymentUrl,
      }),
      textBody: [
        `Hi ${booking.purchaserFirstName},`,
        "",
        `Your remaining ${retreatDate.retreatTitleSnapshot} payment is ready.`,
        `Amount due: ${formatCurrency(amountPence, booking.currency)}`,
        `Due by: ${dueAt ? formatDate(dueAt) : "Before arrival"}`,
        "",
        `Pay here: ${paymentUrl}`,
      ].join("\n"),
      tag: mode === "chaser" ? "retreat-balance-chaser" : "retreat-balance-due",
      templateKey: "retreat-balance-due",
      metadata: {
        bookingId: booking.id,
        retreatDateId: retreatDate.id,
        retreatSlug: retreatDate.retreatSlug,
        mode,
      },
      dispatchMode: "immediate_best_effort",
    });

    if (nextInstalment) {
      await db.retreatBookingInstalment.update({
        where: { id: nextInstalment.id },
        data: mode === "chaser" ? { chaserSentAt: now } : { reminderSentAt: now },
      });
    }

    sent += 1;
  }

  return { sent, skipped };
}

export async function processRetreatCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  const kind = session.metadata?.kind;
  if (!bookingId || !kind) return false;

  const booking = await db.retreatBooking.findUnique({
    where: { id: bookingId },
    include: { retreatDate: true },
  });
  if (!booking) return false;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (kind === "retreat_instalment") {
    const instalmentSequence = Number(session.metadata?.instalmentSequence || "1");
    const paidAt = new Date();

    await db.$transaction(async (tx) => {
      await tx.retreatBookingInstalment.update({
        where: {
          bookingId_sequence: {
            bookingId: booking.id,
            sequence: instalmentSequence,
          },
        },
        data: {
          status: RetreatInstalmentStatus.paid,
          paidAt,
          stripePaymentIntentId: paymentIntentId || undefined,
        },
      });

      const instalments = await tx.retreatBookingInstalment.findMany({
        where: { bookingId: booking.id },
        orderBy: { sequence: "asc" },
      });
      const paidInstalments = instalments.filter(
        (instalment) => instalment.status === RetreatInstalmentStatus.paid
      );
      const depositPaidPence = paidInstalments
        .filter((instalment) => instalment.kind === RetreatInstalmentKind.deposit)
        .reduce((sum, instalment) => sum + instalment.amountPence, 0);
      const fullPaymentPaidPence = paidInstalments
        .filter((instalment) => instalment.kind === RetreatInstalmentKind.full_payment)
        .reduce((sum, instalment) => sum + instalment.amountPence, 0);
      const balancePaidPence = paidInstalments
        .filter((instalment) => instalment.kind !== RetreatInstalmentKind.deposit)
        .reduce((sum, instalment) => sum + instalment.amountPence, 0);
      const allPaid = instalments.every(
        (instalment) => instalment.status === RetreatInstalmentStatus.paid
      );
      const nonInitialPaymentMade = balancePaidPence > 0 && !allPaid;

      await tx.retreatBooking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: allPaid
            ? RetreatPaymentStatus.paid_in_full
            : nonInitialPaymentMade
              ? RetreatPaymentStatus.partially_paid
              : RetreatPaymentStatus.deposit_paid,
          bookingStatus: allPaid
            ? RetreatBookingStatus.paid_in_full
            : RetreatBookingStatus.balance_due,
          depositPaidPence: depositPaidPence || fullPaymentPaidPence,
          depositPaidAt:
            depositPaidPence > 0 || fullPaymentPaidPence > 0 ? paidAt : booking.depositPaidAt,
          balancePaidPence: Math.max(0, balancePaidPence - fullPaymentPaidPence),
          balancePaidAt: allPaid ? paidAt : booking.balancePaidAt,
          stripeDepositPaymentIntentId:
            instalmentSequence === 1
              ? paymentIntentId || booking.stripeDepositPaymentIntentId
              : booking.stripeDepositPaymentIntentId,
          stripeBalancePaymentIntentId:
            instalmentSequence > 1
              ? paymentIntentId || booking.stripeBalancePaymentIntentId
              : booking.stripeBalancePaymentIntentId,
        },
      });
    });

    if (instalmentSequence === 1) {
      await sendDepositConfirmationEmail(booking.id).catch((error) => {
        console.error("Failed to send retreat booking confirmation email", error);
      });
    }
    return true;
  }

  if (kind === "retreat_deposit") {
    const paymentStatus =
      booking.balanceAmountPence > 0
        ? RetreatPaymentStatus.deposit_paid
        : RetreatPaymentStatus.paid_in_full;
    const bookingStatus =
      booking.balanceAmountPence > 0
        ? RetreatBookingStatus.balance_due
        : RetreatBookingStatus.paid_in_full;

    await db.retreatBooking.update({
      where: { id: booking.id },
      data: {
        paymentStatus,
        bookingStatus,
        depositPaidPence: booking.depositAmountPence,
        depositPaidAt: new Date(),
        stripeDepositPaymentIntentId: paymentIntentId || booking.stripeDepositPaymentIntentId,
      },
    });
    await sendDepositConfirmationEmail(booking.id).catch((error) => {
      console.error("Failed to send retreat deposit emails", error);
    });
    return true;
  }

  if (kind === "retreat_balance") {
    await db.retreatBooking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: RetreatPaymentStatus.paid_in_full,
        bookingStatus: RetreatBookingStatus.paid_in_full,
        balancePaidPence: booking.balanceAmountPence,
        balancePaidAt: new Date(),
        stripeBalancePaymentIntentId: paymentIntentId || booking.stripeBalancePaymentIntentId,
      },
    });
    return true;
  }

  return false;
}

export async function createRetreatBalanceCheckout(input: {
  bookingId: string;
  userId?: string | null;
  token?: string | null;
}) {
  const booking = await db.retreatBooking.findUnique({
    where: { id: input.bookingId },
    include: {
      retreatDate: true,
      instalments: {
        orderBy: { sequence: "asc" },
      },
    },
  });
  if (!booking) throw new Error("NOT_FOUND");

  const authorized =
    (input.userId &&
      (booking.purchaserUserId === input.userId || booking.attendeeUserId === input.userId)) ||
    (input.token && booking.balancePaymentUrlToken === input.token);
  if (!authorized) throw new Error("FORBIDDEN");
  if (booking.balanceAmountPence <= 0 || booking.paymentStatus === "paid_in_full") {
    throw new Error("BALANCE_NOT_DUE");
  }
  await assertNoResourceDisputeHold("retreat_booking", booking.id);

  const nextInstalment = getNextPendingRetreatInstalment(booking.instalments);
  const checkoutAmountPence = nextInstalment?.amountPence || booking.balanceAmountPence;
  if (checkoutAmountPence <= 0) {
    throw new Error("BALANCE_NOT_DUE");
  }

  const stripe = getStripeClient();
  const customerId = booking.purchaserUserId
    ? await getOrCreateStripeCustomer({
        userId: booking.purchaserUserId,
        email: booking.purchaserEmail,
        name: `${booking.purchaserFirstName} ${booking.purchaserLastName}`.trim(),
      })
    : undefined;

  const returnPath = input.userId
    ? `/dashboard/retreats/${booking.id}?balance=success`
    : `/retreats/balance/${booking.balancePaymentUrlToken}?checkout=success`;
  const cancelPath = input.userId
    ? `/dashboard/retreats/${booking.id}?balance=cancelled`
    : `/retreats/balance/${booking.balancePaymentUrlToken}?checkout=cancelled`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    customer_email: customerId ? undefined : booking.purchaserEmail,
    success_url: buildAbsoluteUrl(returnPath),
    cancel_url: buildAbsoluteUrl(cancelPath),
    line_items: [
      {
        price_data: {
          currency: booking.currency.toLowerCase(),
          product_data: {
            name: nextInstalment
              ? `${booking.retreatDate.retreatTitleSnapshot}: ${nextInstalment.label}`
              : `${booking.retreatDate.retreatTitleSnapshot} balance`,
            description: formatDateRange(booking.retreatDate.startsAt, booking.retreatDate.endsAt),
          },
          unit_amount: checkoutAmountPence,
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: nextInstalment ? "retreat_instalment" : "retreat_balance",
      bookingId: booking.id,
      retreatSlug: booking.retreatDate.retreatSlug,
      userId: input.userId || "",
      instalmentSequence: nextInstalment ? String(nextInstalment.sequence) : "",
    },
  });

  if (!session.url) throw new Error("STRIPE_CHECKOUT_URL_MISSING");

  if (nextInstalment) {
    await db.retreatBookingInstalment.update({
      where: { id: nextInstalment.id },
      data: { stripeCheckoutSessionId: session.id },
    });
  } else {
    await db.retreatBooking.update({
      where: { id: booking.id },
      data: { stripeBalanceSessionId: session.id },
    });
  }

  return {
    checkoutUrl: session.url,
  };
}

export async function getAdminRetreatEvidence(retreatDateId: string) {
  const retreatDate = await db.retreatDate.findUnique({
    where: { id: retreatDateId },
    include: {
      bookings: {
        orderBy: { createdAt: "asc" },
        include: {
          guestAcceptanceEvents: {
            orderBy: [{ acceptedAt: "asc" }, { createdAt: "asc" }],
          },
        },
      },
      giftPurchases: {
        orderBy: { createdAt: "asc" },
        include: {
          guestAcceptanceEvents: {
            orderBy: [{ acceptedAt: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });
  if (!retreatDate) {
    throw new Error("NOT_FOUND");
  }

  return {
    retreatDateId: retreatDate.id,
    bookings: retreatDate.bookings.map((booking) => ({
      id: booking.id,
      purchaserEmail: booking.purchaserEmail,
      attendeeEmail: booking.attendeeEmail,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      guestAcceptances: booking.guestAcceptanceEvents.map((event) => ({
        id: event.id,
        purchaserEmail: event.purchaserEmail,
        type: event.type,
        version: event.version,
        acceptedAt: event.acceptedAt.toISOString(),
        surface: event.acceptanceSurface,
      })),
    })),
    gifts: retreatDate.giftPurchases.map((gift) => ({
      id: gift.id,
      purchaserEmail: gift.purchaserEmail,
      recipientEmail: gift.recipientEmail,
      status: gift.status,
      guestAcceptances: gift.guestAcceptanceEvents.map((event) => ({
        id: event.id,
        purchaserEmail: event.purchaserEmail,
        type: event.type,
        version: event.version,
        acceptedAt: event.acceptedAt.toISOString(),
        surface: event.acceptanceSurface,
      })),
    })),
  };
}

export async function getRetreatBalancePaymentStateByToken(token: string) {
  const booking = await db.retreatBooking.findFirst({
    where: { balancePaymentUrlToken: token },
    include: {
      retreatDate: true,
      instalments: {
        orderBy: { sequence: "asc" },
      },
    },
  });
  if (!booking) throw new Error("NOT_FOUND");

  const nextInstalment = getNextPendingRetreatInstalment(booking.instalments);

  return {
    bookingId: booking.id,
    retreatSlug: booking.retreatDate.retreatSlug,
    retreatTitle: booking.retreatDate.retreatTitleSnapshot,
    retreatLocation: booking.retreatDate.retreatLocationSnapshot,
    dateLabel: formatDateRange(booking.retreatDate.startsAt, booking.retreatDate.endsAt),
    purchaserName: `${booking.purchaserFirstName} ${booking.purchaserLastName}`.trim(),
    balanceAmountPence: nextInstalment?.amountPence || booking.balanceAmountPence,
    currency: booking.currency,
    paymentStatus: booking.paymentStatus,
    dueDate: nextInstalment?.dueAt?.toISOString() || booking.balanceDueAt?.toISOString() || null,
  };
}

export async function getMyRetreatBookings(userId: string) {
  const bookings = await db.retreatBooking.findMany({
    where: {
      OR: [{ purchaserUserId: userId }, { attendeeUserId: userId }],
    },
    include: { retreatDate: true, roomOption: true },
    orderBy: { retreatDate: { startsAt: "asc" } },
  });

  return bookings.map((booking) => ({
    id: booking.id,
    retreatSlug: booking.retreatDate.retreatSlug,
    retreatTitle: booking.retreatDate.retreatTitleSnapshot,
    location: booking.retreatDate.retreatLocationSnapshot,
    startsAt: booking.retreatDate.startsAt.toISOString(),
    endsAt: booking.retreatDate.endsAt.toISOString(),
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    totalPricePence: booking.totalPricePence,
    depositPaidPence: booking.depositPaidPence,
    balanceAmountPence: booking.balanceAmountPence,
    balanceDueAt: booking.balanceDueAt?.toISOString() || null,
    roomType: booking.roomOptionLabelSnapshot || booking.roomType,
    dietaryRequirements: booking.dietaryRequirements,
    medicalConditions: booking.medicalConditions,
    mobilityNeeds: booking.mobilityNeeds,
    canPayBalance: booking.paymentStatus !== "paid_in_full" && booking.balanceAmountPence > 0,
  }));
}

export async function getMyRetreatBookingDetail(userId: string, bookingId: string) {
  const booking = await db.retreatBooking.findFirst({
    where: {
      id: bookingId,
      OR: [{ purchaserUserId: userId }, { attendeeUserId: userId }],
    },
    include: { retreatDate: true, roomOption: true },
  });
  if (!booking) throw new Error("NOT_FOUND");

  return {
    id: booking.id,
    retreatSlug: booking.retreatDate.retreatSlug,
    retreatTitle: booking.retreatDate.retreatTitleSnapshot,
    location: booking.retreatDate.retreatLocationSnapshot,
    startsAt: booking.retreatDate.startsAt.toISOString(),
    endsAt: booking.retreatDate.endsAt.toISOString(),
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    totalPricePence: booking.totalPricePence,
    depositPaidPence: booking.depositPaidPence,
    balanceAmountPence: booking.balanceAmountPence,
    balanceDueAt: booking.balanceDueAt?.toISOString() || null,
    roomType: booking.roomOptionLabelSnapshot || booking.roomType,
    dietaryRequirements: booking.dietaryRequirements,
    medicalConditions: booking.medicalConditions,
    mobilityNeeds: booking.mobilityNeeds,
    emergencyContactName: booking.emergencyContactName,
    emergencyContactPhone: booking.emergencyContactPhone,
    canPayBalance: booking.paymentStatus !== "paid_in_full" && booking.balanceAmountPence > 0,
  };
}

export async function getAdminRetreatSummaries() {
  const [retreats, retreatDates] = await Promise.all([
    getRetreatsCombined(),
    db.retreatDate.findMany({
      orderBy: { startsAt: "asc" },
      include: {
        bookings: true,
      },
    }),
  ]);

  const retreatMap = new Map(retreats.map((retreat) => [retreat.slug, retreat]));
  return retreatDates.map((date) => {
    const content = retreatMap.get(date.retreatSlug);
    const confirmed = date.bookings.filter((booking) =>
      ["deposit_paid", "balance_due", "paid_in_full"].includes(booking.bookingStatus)
    );
    const bookedSpaces = confirmed.reduce(
      (sum, booking) => sum + Math.max(booking.attendeeCount || booking.guestsIncluded || 1, 1),
      0
    );
    const revenuePence = date.bookings.reduce(
      (sum, booking) => sum + booking.depositPaidPence + booking.balancePaidPence,
      0
    );

    return {
      id: date.id,
      retreatSlug: date.retreatSlug,
      title: date.retreatTitleSnapshot,
      location: date.retreatLocationSnapshot,
      startDate: date.startsAt.toISOString(),
      endDate: date.endsAt.toISOString(),
      status: date.status,
      bookedSpaces,
      totalSpaces: date.capacity,
      revenuePence,
      earlyBirdPricePence: content ? content.earlyBirdPrice * 100 : date.pricePence,
      normalPricePence: content ? content.normalPrice * 100 : date.pricePence,
    };
  });
}

export async function setUpRetreatOnlineRoom(retreatDateId: string) {
  const retreatDate = await db.retreatDate.findUnique({
    where: { id: retreatDateId },
    select: {
      id: true,
      retreatType: true,
      startsAt: true,
      endsAt: true,
      dailyRoomName: true,
      dailyRoomUrl: true,
      onlineRoomSetupStatus: true,
    },
  });
  if (!retreatDate) throw new Error("NOT_FOUND");
  if (retreatDate.retreatType !== "online") throw new Error("NOT_ONLINE_RETREAT");

  if (
    retreatDate.dailyRoomName &&
    retreatDate.dailyRoomUrl &&
    retreatDate.onlineRoomSetupStatus === ClassRoomSetupStatus.ready
  ) {
    return retreatDate;
  }

  if (!isDailyConfigured()) {
    await db.retreatDate.update({
      where: { id: retreatDate.id },
      data: {
        onlineRoomSetupStatus: ClassRoomSetupStatus.pending,
        onlineRoomSetupError: "Daily is not configured",
      },
    });
    throw new Error("DAILY_NOT_CONFIGURED");
  }

  try {
    const room = await createSessionRoom(
      `retreat-${retreatDate.id}`,
      retreatDate.startsAt,
      retreatDate.endsAt
    );
    return db.retreatDate.update({
      where: { id: retreatDate.id },
      data: {
        dailyRoomName: room.roomName,
        dailyRoomUrl: room.roomUrl,
        onlineRoomSetupStatus: ClassRoomSetupStatus.ready,
        onlineRoomSetupError: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Daily room";
    await db.retreatDate.update({
      where: { id: retreatDate.id },
      data: {
        onlineRoomSetupStatus: ClassRoomSetupStatus.failed,
        onlineRoomSetupError: message,
      },
    });
    throw error;
  }
}

export async function getAdminRetreatDetail(retreatDateId: string) {
  const bookingRows = await db.retreatDate.findUnique({
    where: { id: retreatDateId },
    include: {
      bookings: {
        orderBy: { createdAt: "asc" },
        include: {
          roomUnit: true,
          instalments: {
            orderBy: { sequence: "asc" },
          },
        },
      },
    },
  });
  if (!bookingRows) throw new Error("NOT_FOUND");

  const revenuePence = bookingRows.bookings.reduce(
    (sum, booking) => sum + booking.depositPaidPence + booking.balancePaidPence,
    0
  );

  return {
    id: bookingRows.id,
    retreatSlug: bookingRows.retreatSlug,
    title: bookingRows.retreatTitleSnapshot,
    location: bookingRows.retreatLocationSnapshot,
    startDate: bookingRows.startsAt.toISOString(),
    endDate: bookingRows.endsAt.toISOString(),
    status: bookingRows.status,
    retreatType: bookingRows.retreatType,
    dailyRoomUrl: bookingRows.dailyRoomUrl,
    roomSetupStatus: bookingRows.onlineRoomSetupStatus,
    roomSetupError: bookingRows.onlineRoomSetupError,
    capacity: bookingRows.capacity,
    revenuePence,
    depositAmountPence: bookingRows.depositAmountPence,
    pricePence: bookingRows.pricePence,
    singleRoomSupplementPence: bookingRows.singleRoomSupplementPence,
    balanceDueAt: bookingRows.balanceDueAt?.toISOString() || null,
    bookings: bookingRows.bookings.map((booking) => ({
      id: booking.id,
      purchaserName: `${booking.purchaserFirstName} ${booking.purchaserLastName}`.trim(),
      purchaserEmail: booking.purchaserEmail,
      attendeeName: `${booking.attendeeFirstName} ${booking.attendeeLastName}`.trim(),
      attendeeEmail: booking.attendeeEmail,
      attendeeCount: booking.attendeeCount,
      roomType: booking.roomOptionLabelSnapshot || booking.roomType,
      roomUnitLabel: booking.roomUnit?.label || null,
      dietaryRequirements: booking.dietaryRequirements,
      medicalConditions: booking.medicalConditions,
      mobilityNeeds: booking.mobilityNeeds,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      depositPaidPence: booking.depositPaidPence,
      balancePaidPence: booking.balancePaidPence,
      totalPricePence: booking.totalPricePence,
      payInFullDiscountPence: booking.payInFullDiscountPence,
      nonRefundableAmountPence: booking.nonRefundableAmountPence,
      instalments: booking.instalments.map((instalment) => ({
        id: instalment.id,
        sequence: instalment.sequence,
        kind: instalment.kind,
        label: instalment.label,
        amountPence: instalment.amountPence,
        status: instalment.status,
        dueAt: instalment.dueAt?.toISOString() || null,
        paidAt: instalment.paidAt?.toISOString() || null,
      })),
      bookedAt: booking.bookedAt.toISOString(),
    })),
  };
}
