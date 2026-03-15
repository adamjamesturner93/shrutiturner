import { GiftPurchaseStatus, RetreatBookingStatus, RetreatPaymentStatus } from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { buildAbsoluteUrl, getBaseSiteUrl } from "@/lib/app-url";
import { getStripeClient } from "@/lib/billing/stripe-client";
import {
  getRetreatBySlugCombined,
  getRetreatsCombined,
  type RetreatCombinedContent,
} from "@/lib/content";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";
import RetreatBookingEmail from "@/emails/retreat-booking";
import RetreatBalanceDueEmail from "@/emails/retreat-balance-due";

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

function getDepositAmountPence(totalPricePence: number) {
  if (totalPricePence <= 25000) return totalPricePence;
  return Math.min(totalPricePence, 30000);
}

function getBalanceDueDate(startDate: Date) {
  return new Date(startDate.getTime() - 45 * 86400000);
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
  const [bookingCount, giftCount] = await Promise.all([
    db.retreatBooking.count({
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
  ]);
  return bookingCount + giftCount;
}

export async function syncRetreatDateFromContent(slug: string, externalDateId: string) {
  const { retreat, instance } = await getRetreatAndInstance(slug, externalDateId);
  const startsAt = parseIsoDate(instance.startDate);
  const endsAt = parseIsoDate(instance.endDate);
  const earlyBird = isEarlyBirdActive(retreat);
  const basePricePence = (earlyBird ? retreat.earlyBirdPrice : retreat.normalPrice) * 100;
  const depositAmountPence = getDepositAmountPence(basePricePence);
  const balanceDueAt = getBalanceDueDate(startsAt);

  const retreatDate = await db.retreatDate.upsert({
    where: { externalDateId },
    create: {
      externalDateId,
      retreatSlug: retreat.slug,
      retreatTitleSnapshot: retreat.title,
      retreatLocationSnapshot: retreat.location,
      startsAt,
      endsAt,
      capacity: instance.totalSpaces,
      status: instance.availableSpaces > 0 ? "open" : "sold_out",
      currency: retreat.currency,
      pricePence: basePricePence,
      depositAmountPence,
      singleRoomSupplementPence: 0,
      balanceDueAt,
    },
    update: {
      retreatSlug: retreat.slug,
      retreatTitleSnapshot: retreat.title,
      retreatLocationSnapshot: retreat.location,
      startsAt,
      endsAt,
      capacity: instance.totalSpaces,
      status: instance.availableSpaces > 0 ? "open" : "sold_out",
      currency: retreat.currency,
      pricePence: basePricePence,
      depositAmountPence,
      singleRoomSupplementPence: 0,
      balanceDueAt,
    },
  });

  for (const roomOption of instance.roomOptions) {
    const roomPricePence = earlyBird
      ? (roomOption.earlyBirdPricePence ?? roomOption.normalPricePence)
      : roomOption.normalPricePence;
    const roomDepositPence = roomOption.depositPence ?? getDepositAmountPence(roomPricePence);
    await db.retreatRoomOption.upsert({
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
        depositAmountPence: roomDepositPence,
        isWaitlistOnly: roomOption.isWaitlistOnly === true,
      },
    });
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
  const { retreatDate, roomOption } = await getSyncedRetreatDateAndRoomOption({
    retreatSlug: input.retreatSlug,
    retreatDateId: input.retreatDateId,
    roomOptionId: input.roomOptionId,
  });

  const purchaserFirstName = normalizeText(input.purchaserFirstName, 80);
  const purchaserLastName = normalizeText(input.purchaserLastName, 80);
  const purchaserEmail = normalizeEmail(input.purchaserEmail);
  const purchaserName = `${purchaserFirstName} ${purchaserLastName}`.trim();

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
        totalPaidPence: roomOption.pricePence,
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
            unit_amount: roomOption.pricePence,
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

  const depositAmountPence = Math.min(
    roomOption.depositAmountPence || roomOption.pricePence,
    roomOption.pricePence
  );
  const balanceAmountPence = Math.max(0, roomOption.pricePence - depositAmountPence);

  const booking = await db.retreatBooking.create({
    data: {
      retreatDateId: retreatDate.id,
      roomOptionId: roomOption.id,
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
      acceptedTermsVersion: input.acceptedTermsVersion || null,
      acceptedHealthWaiverVersion: input.acceptedHealthWaiverVersion || null,
      acceptedHealthDataVersion: input.acceptedHealthDataVersion || null,
      totalPricePence: roomOption.pricePence,
      depositAmountPence,
      balanceAmountPence,
      currency: retreatDate.currency,
      bookingStatus: "pending",
      paymentStatus: "unpaid",
      balancePaymentUrlToken: balanceAmountPence > 0 ? createBalanceToken() : null,
      balanceDueAt: retreatDate.balanceDueAt,
    },
    include: { retreatDate: true },
  });

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
            name: `${retreatDate.retreatTitleSnapshot} deposit`,
            description: `${roomOption.label} · ${formatDateRange(
              retreatDate.startsAt,
              retreatDate.endsAt
            )}`,
          },
          unit_amount: depositAmountPence,
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: "retreat_deposit",
      bookingId: booking.id,
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
    },
  });

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
    metadata: {
      bookingId: booking.id,
      retreatSlug: booking.retreatDate.retreatSlug,
    },
  });

  if (booking.balanceAmountPence > 0 && booking.balancePaymentUrlToken) {
    const paymentUrl = buildAbsoluteUrl(`/retreats/balance/${booking.balancePaymentUrlToken}`);
    await sendPostmarkReactEmail({
      to: booking.purchaserEmail,
      subject: `${booking.retreatDate.retreatTitleSnapshot}: balance payment link`,
      react: RetreatBalanceDueEmail({
        firstName: booking.purchaserFirstName,
        retreatName: booking.retreatDate.retreatTitleSnapshot,
        retreatDates: formatDateRange(booking.retreatDate.startsAt, booking.retreatDate.endsAt),
        balanceAmount: formatCurrency(booking.balanceAmountPence, booking.currency),
        dueDate: booking.balanceDueAt ? formatDate(booking.balanceDueAt) : "Before arrival",
        paymentUrl,
      }),
      textBody: `Your balance payment link for ${booking.retreatDate.retreatTitleSnapshot}\nAmount due: ${formatCurrency(booking.balanceAmountPence, booking.currency)}\nDue by: ${booking.balanceDueAt ? formatDate(booking.balanceDueAt) : "Before arrival"}\nPay here: ${paymentUrl}`,
      tag: "retreat-balance-due",
      metadata: {
        bookingId: booking.id,
        retreatSlug: booking.retreatDate.retreatSlug,
      },
    });
  }
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
    include: { retreatDate: true },
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
            name: `${booking.retreatDate.retreatTitleSnapshot} balance`,
            description: formatDateRange(booking.retreatDate.startsAt, booking.retreatDate.endsAt),
          },
          unit_amount: booking.balanceAmountPence,
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: "retreat_balance",
      bookingId: booking.id,
      retreatSlug: booking.retreatDate.retreatSlug,
      userId: input.userId || "",
    },
  });

  if (!session.url) throw new Error("STRIPE_CHECKOUT_URL_MISSING");

  await db.retreatBooking.update({
    where: { id: booking.id },
    data: { stripeBalanceSessionId: session.id },
  });

  return {
    checkoutUrl: session.url,
  };
}

export async function getRetreatBalancePaymentStateByToken(token: string) {
  const booking = await db.retreatBooking.findFirst({
    where: { balancePaymentUrlToken: token },
    include: { retreatDate: true },
  });
  if (!booking) throw new Error("NOT_FOUND");

  return {
    bookingId: booking.id,
    retreatSlug: booking.retreatDate.retreatSlug,
    retreatTitle: booking.retreatDate.retreatTitleSnapshot,
    retreatLocation: booking.retreatDate.retreatLocationSnapshot,
    dateLabel: formatDateRange(booking.retreatDate.startsAt, booking.retreatDate.endsAt),
    purchaserName: `${booking.purchaserFirstName} ${booking.purchaserLastName}`.trim(),
    balanceAmountPence: booking.balanceAmountPence,
    currency: booking.currency,
    paymentStatus: booking.paymentStatus,
    dueDate: booking.balanceDueAt?.toISOString() || null,
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
      bookedSpaces: confirmed.length,
      totalSpaces: date.capacity,
      revenuePence,
      earlyBirdPricePence: content ? content.earlyBirdPrice * 100 : date.pricePence,
      normalPricePence: content ? content.normalPrice * 100 : date.pricePence,
    };
  });
}

export async function getAdminRetreatDetail(retreatDateId: string) {
  const bookingRows = await db.retreatDate.findUnique({
    where: { id: retreatDateId },
    include: {
      bookings: {
        orderBy: { createdAt: "asc" },
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
      roomType: booking.roomOptionLabelSnapshot || booking.roomType,
      dietaryRequirements: booking.dietaryRequirements,
      medicalConditions: booking.medicalConditions,
      mobilityNeeds: booking.mobilityNeeds,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      depositPaidPence: booking.depositPaidPence,
      balancePaidPence: booking.balancePaidPence,
      totalPricePence: booking.totalPricePence,
      bookedAt: booking.bookedAt.toISOString(),
    })),
  };
}
