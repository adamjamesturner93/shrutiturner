import {
  AcceptanceType,
  ClassRoomSetupStatus,
  GiftPurchaseStatus,
  Prisma,
  RetreatBookingStatus,
  RetreatBookingItemType,
  RetreatBookingUnit,
  RetreatDepositType,
  RetreatInventoryType,
  RetreatInstalmentKind,
  RetreatInstalmentStatus,
  RetreatOnlineAccessType,
  RetreatPaymentStatus,
  RetreatDateStatus,
  RetreatCancellationStatus,
  RetreatRefundStatus,
  RetreatLiveRoomState,
} from "@prisma/client";
import type Stripe from "stripe";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { buildAbsoluteUrl, getBaseSiteUrl } from "@/lib/app-url";
import { getStripeClient } from "@/lib/billing/stripe-client";
import {
  assertNoResourceDisputeHold,
  assertNoUserCheckoutDisputeHold,
} from "@/lib/billing/dispute-service";
import {
  getRetreatBySlugCombined,
  getRetreatTemplates,
  getRetreatVenues,
  type RetreatCombinedContent,
  type RetreatRoomOptionContent,
  type RetreatTemplateContent,
  type RetreatVenueContent,
} from "@/lib/content";
import { assertCurrentAcceptances } from "@/lib/legal/acceptance-service";
import { getCurrentPolicyVersions } from "@/lib/legal/policy-service";
import { sendPostmarkReactEmail } from "@/lib/postmark/client";
import RetreatBookingEmail from "@/emails/retreat-booking";
import RetreatBalanceDueEmail from "@/emails/retreat-balance-due";
import RetreatCancellationEmail, {
  RetreatCancellationAdminEmail,
} from "@/emails/retreat-cancellation";
import RetreatBookingAdminEmail from "@/emails/retreat-booking-admin";
import RetreatPaymentReceiptEmail from "@/emails/retreat-payment-receipt";
import { createAdminActionLog } from "@/lib/admin/action-log-service";
import { createSessionRoom, isDailyConfigured } from "@/lib/daily/service";
import {
  buildRetreatInstalmentPlan,
  canExtendPublishedEarlyBirdRate,
  calculatePayInFullDiscount,
  calculateRetreatRefund,
  calculateRetreatNonRefundableAmount,
  getEffectiveRetreatRatePricePence,
  getRetreatOptionAvailability,
  quoteRetreatAccommodation,
  type RetreatDepositRuleInput,
  type RetreatPaymentPlan,
  type RetreatType,
} from "@/lib/retreats/pricing";
import { getRetreatImageSrc } from "@/lib/retreats/images";
import { sendRetreatOperationalEmail } from "@/lib/retreats/notification-service";

const RETREAT_PAYMENT_WINDOW_MS = 30 * 60 * 1000;
const ACTIVE_RETREAT_BOOKING_STATUSES: RetreatBookingStatus[] = [
  RetreatBookingStatus.deposit_paid,
  RetreatBookingStatus.balance_due,
  RetreatBookingStatus.paid_in_full,
];
const OPEN_RETREAT_CANCELLATION_STATUSES: RetreatCancellationStatus[] = [
  RetreatCancellationStatus.requested,
  RetreatCancellationStatus.approved,
  RetreatCancellationStatus.processing,
  RetreatCancellationStatus.completed,
];
const APPROVABLE_RETREAT_CANCELLATION_STATUSES: RetreatCancellationStatus[] = [
  RetreatCancellationStatus.requested,
  RetreatCancellationStatus.approved,
  RetreatCancellationStatus.failed,
];

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

const RETREAT_LIVE_JOIN_LEAD_MS = 30 * 60 * 1000;
const RETREAT_LIVE_JOIN_GRACE_MS = 2 * 60 * 60 * 1000;

export async function ensureRetreatOnlineAccessEntitlement(bookingId: string) {
  const booking = await db.retreatBooking.findUnique({
    where: { id: bookingId },
    include: {
      retreatDate: true,
      items: {
        where: { itemType: RetreatBookingItemType.addon },
        include: { addon: true },
      },
    },
  });
  if (!booking || booking.retreatDate.retreatType !== "online") return null;
  if (!booking.attendeeUserId && !booking.purchaserUserId) return null;

  const userId = booking.attendeeUserId || booking.purchaserUserId;
  const accessType = booking.retreatDate.replayAccessDurationDays
    ? RetreatOnlineAccessType.live_and_replay
    : RetreatOnlineAccessType.live_only;
  const liveAccessStartsAt = new Date(
    booking.retreatDate.startsAt.getTime() - RETREAT_LIVE_JOIN_LEAD_MS
  );
  const liveAccessEndsAt = new Date(
    booking.retreatDate.endsAt.getTime() + RETREAT_LIVE_JOIN_GRACE_MS
  );
  const existing = await db.retreatOnlineAccessEntitlement.findFirst({
    where: { bookingId: booking.id, attendeeEmail: booking.attendeeEmail },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return db.retreatOnlineAccessEntitlement.update({
      where: { id: existing.id },
      data: {
        userId,
        accessType,
        liveAccessEnabled: true,
        liveAccessStartsAt,
        liveAccessEndsAt,
      },
    });
  }

  return db.retreatOnlineAccessEntitlement.create({
    data: {
      bookingId: booking.id,
      retreatDateId: booking.retreatDateId,
      userId,
      attendeeEmail: booking.attendeeEmail,
      accessType,
      liveAccessEnabled: true,
      replayAccessEnabled: false,
      liveAccessStartsAt,
      liveAccessEndsAt,
    },
  });
}

function getDepositAmountPence(totalPricePence: number) {
  if (totalPricePence <= 25000) return totalPricePence;
  return Math.min(totalPricePence, 30000);
}

function getBalanceDueDate(startDate: Date) {
  return new Date(startDate.getTime() - 45 * 86400000);
}

function parseRetreatType(value: string | undefined | null): RetreatType {
  return value === "online" ? "online" : "in_person";
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function getRetreatRefundPolicySnapshot(input: {
  retreatType: RetreatType;
  totalPence: number;
  depositPence: number;
  startsAt: Date;
}) {
  const nonRefundableAmountPence = calculateRetreatNonRefundableAmount({
    retreatType: input.retreatType,
    totalPence: input.totalPence,
    depositPence: input.depositPence,
  });
  const cutoffDays = input.retreatType === "online" ? 14 : 56;
  return {
    retreatType: input.retreatType,
    nonRefundableAmountPence,
    refundCutoffDaysBeforeStart: cutoffDays,
    refundCutoffAt: new Date(input.startsAt.getTime() - cutoffDays * 86400000).toISOString(),
  };
}

async function lockRetreatResource(tx: Prisma.TransactionClient, key: string) {
  await tx.$queryRaw`
    SELECT pg_advisory_xact_lock(hashtext(${key})) IS NULL AS "acquired"
  `;
}

export async function assignRoomUnitAfterPayment(bookingId: string) {
  return db.$transaction(async (tx) => {
    const booking = await tx.retreatBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        roomUnitId: true,
        retreatDateId: true,
        roomOptionId: true,
        roomOption: {
          select: { inventoryPoolId: true, inventoryUnitsPerBooking: true },
        },
        items: {
          where: {
            itemType: {
              in: [RetreatBookingItemType.accommodation, RetreatBookingItemType.online_live_place],
            },
          },
          select: { inventoryPoolId: true, quantity: true },
        },
        retreatDate: { select: { retreatType: true } },
      },
    });
    if (!booking || booking.roomUnitId || !booking.roomOptionId) return null;
    if (booking.retreatDate.retreatType === "online") return null;

    const inventoryPoolId = booking.roomOption?.inventoryPoolId || null;
    const requestedUnits = Math.max(
      booking.items
        .filter((item) => !inventoryPoolId || item.inventoryPoolId === inventoryPoolId)
        .reduce((sum, item) => sum + item.quantity, 0) ||
        booking.roomOption?.inventoryUnitsPerBooking ||
        1,
      1
    );
    await lockRetreatResource(
      tx,
      inventoryPoolId
        ? `retreat-inventory-pool:${inventoryPoolId}`
        : `retreat-room-option:${booking.roomOptionId}`
    );
    const roomUnits = await tx.retreatRoomUnit.findMany({
      where: {
        retreatDateId: booking.retreatDateId,
        ...(inventoryPoolId ? { inventoryPoolId } : { roomOptionId: booking.roomOptionId }),
        status: { not: "unavailable" },
      },
      include: {
        bookings: {
          where: { bookingStatus: { in: ACTIVE_RETREAT_BOOKING_STATUSES } },
          select: {
            id: true,
            roomOption: { select: { inventoryUnitsPerBooking: true } },
            items: {
              where: {
                itemType: {
                  in: [
                    RetreatBookingItemType.accommodation,
                    RetreatBookingItemType.online_live_place,
                  ],
                },
              },
              select: { inventoryPoolId: true, quantity: true },
            },
          },
        },
      },
      orderBy: { label: "asc" },
    });
    const getOccupiedUnits = (unit: (typeof roomUnits)[number]) =>
      unit.bookings.reduce(
        (sum, assignedBooking) =>
          sum +
          Math.max(
            assignedBooking.items
              .filter((item) => !inventoryPoolId || item.inventoryPoolId === inventoryPoolId)
              .reduce((itemSum, item) => itemSum + item.quantity, 0) ||
              assignedBooking.roomOption?.inventoryUnitsPerBooking ||
              1,
            1
          ),
        0
      );
    const roomUnit = roomUnits.find(
      (unit) => getOccupiedUnits(unit) + requestedUnits <= unit.capacityUnits
    );
    if (!roomUnit) throw new Error("ROOM_UNIT_UNAVAILABLE");

    const willBeFull = getOccupiedUnits(roomUnit) + requestedUnits >= roomUnit.capacityUnits;
    await tx.retreatBooking.update({
      where: { id: booking.id },
      data: { roomUnitId: roomUnit.id },
    });
    await tx.retreatRoomUnit.update({
      where: { id: roomUnit.id },
      data: { status: willBeFull ? "assigned" : "available" },
    });
    return roomUnit.id;
  });
}

async function releaseRoomUnitForBooking(bookingId: string) {
  return db.$transaction(async (tx) => {
    const booking = await tx.retreatBooking.findUnique({
      where: { id: bookingId },
      select: { id: true, roomUnitId: true },
    });
    if (!booking?.roomUnitId) return;
    await lockRetreatResource(tx, `retreat-room-unit:${booking.roomUnitId}`);
    await tx.retreatBooking.update({
      where: { id: booking.id },
      data: { roomUnitId: null },
    });
    const activeBookings = await tx.retreatBooking.findMany({
      where: {
        roomUnitId: booking.roomUnitId,
        bookingStatus: { in: ACTIVE_RETREAT_BOOKING_STATUSES },
      },
      select: {
        roomOption: { select: { inventoryUnitsPerBooking: true } },
        items: {
          where: {
            itemType: {
              in: [RetreatBookingItemType.accommodation, RetreatBookingItemType.online_live_place],
            },
          },
          select: { quantity: true },
        },
      },
    });
    const activeOccupancy = activeBookings.reduce(
      (sum, activeBooking) =>
        sum +
        Math.max(
          activeBooking.items.reduce((itemSum, item) => itemSum + item.quantity, 0) ||
            activeBooking.roomOption?.inventoryUnitsPerBooking ||
            1,
          1
        ),
      0
    );
    await tx.retreatRoomUnit.update({
      where: { id: booking.roomUnitId },
      data: { status: activeOccupancy > 0 ? "assigned" : "available" },
    });
  });
}

async function createGuestAcceptanceEventsForRetreatPurchase(input: {
  purchaserEmail: string;
  surface: string;
  retreatBookingId?: string;
  giftPurchaseId?: string;
  retreatSlug: string;
  retreatDateId: string;
  roomOptionId: string;
  guestCount?: number;
  purchaseMode: "self" | "gift";
}) {
  const acceptanceTypes =
    input.purchaseMode === "gift"
      ? ([AcceptanceType.terms] as const)
      : ([AcceptanceType.terms, AcceptanceType.health_waiver, AcceptanceType.health_data] as const);
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

function getActiveRoomInventoryBookingWhere(now: Date): Prisma.RetreatBookingWhereInput {
  return {
    OR: [
      { bookingStatus: { in: ACTIVE_RETREAT_BOOKING_STATUSES } },
      {
        bookingStatus: RetreatBookingStatus.pending,
        createdAt: { gt: new Date(now.getTime() - RETREAT_PAYMENT_WINDOW_MS) },
      },
    ],
  };
}

const activeGiftInventoryWhere = (now: Date): Prisma.GiftPurchaseWhereInput => ({
  OR: [
    { status: GiftPurchaseStatus.purchased },
    {
      status: GiftPurchaseStatus.pending_payment,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  ],
});

async function getRoomAvailability(roomOptionId: string) {
  const now = new Date();
  const activeBookingWhere = getActiveRoomInventoryBookingWhere(now);
  const giftWhere = activeGiftInventoryWhere(now);
  const option = await db.retreatRoomOption.findUnique({
    where: { id: roomOptionId },
    include: { inventoryPool: true },
  });
  if (!option) throw new Error("ROOM_OPTION_NOT_FOUND");

  const [optionBookingCount, optionGiftCount] = await Promise.all([
    db.retreatBooking.count({
      where: {
        roomOptionId,
        ...activeBookingWhere,
      },
    }),
    db.giftPurchase.count({
      where: {
        retreatRoomOptionId: roomOptionId,
        ...giftWhere,
      },
    }),
  ]);
  const optionAvailability = getRetreatOptionAvailability({
    optionCapacity: option.capacity,
    reservedOptionBookings: optionBookingCount + optionGiftCount,
  });
  if (!option.inventoryPoolId || !option.inventoryPool) return optionAvailability;

  const [bookingItems, legacyBookings, gifts] = await Promise.all([
    db.retreatBookingItem.aggregate({
      where: {
        inventoryPoolId: option.inventoryPoolId,
        itemType: {
          in: [RetreatBookingItemType.accommodation, RetreatBookingItemType.online_live_place],
        },
        booking: activeBookingWhere,
      },
      _sum: { quantity: true },
    }),
    db.retreatBooking.findMany({
      where: {
        roomOption: { inventoryPoolId: option.inventoryPoolId },
        ...activeBookingWhere,
        items: {
          none: {
            itemType: {
              in: [RetreatBookingItemType.accommodation, RetreatBookingItemType.online_live_place],
            },
          },
        },
      },
      select: { roomOption: { select: { inventoryUnitsPerBooking: true } } },
    }),
    db.giftPurchase.findMany({
      where: {
        retreatRoomOption: { inventoryPoolId: option.inventoryPoolId },
        ...giftWhere,
      },
      select: { retreatRoomOption: { select: { inventoryUnitsPerBooking: true } } },
    }),
  ]);
  const reservedPoolUnits =
    (bookingItems._sum.quantity || 0) +
    legacyBookings.reduce(
      (sum, booking) => sum + (booking.roomOption?.inventoryUnitsPerBooking || 1),
      0
    ) +
    gifts.reduce((sum, gift) => sum + (gift.retreatRoomOption?.inventoryUnitsPerBooking || 1), 0);
  return getRetreatOptionAvailability({
    optionCapacity: option.capacity,
    reservedOptionBookings: optionBookingCount + optionGiftCount,
    poolTotalUnits: option.inventoryPool.totalQuantity,
    reservedPoolUnits,
    inventoryUnitsPerBooking: option.inventoryUnitsPerBooking,
  });
}

async function assertRoomInventoryAvailableForUpdate(
  tx: Prisma.TransactionClient,
  roomOptionId: string,
  requestedBookings: number
) {
  const now = new Date();
  const activeBookingWhere = getActiveRoomInventoryBookingWhere(now);
  const giftWhere = activeGiftInventoryWhere(now);
  const option = await tx.retreatRoomOption.findUnique({
    where: { id: roomOptionId },
    include: { inventoryPool: true },
  });
  if (!option) throw new Error("ROOM_OPTION_NOT_FOUND");
  await lockRetreatResource(
    tx,
    option.inventoryPoolId
      ? `retreat-inventory-pool:${option.inventoryPoolId}`
      : `retreat-room-option:${roomOptionId}`
  );

  const [optionBookingCount, optionGiftCount] = await Promise.all([
    tx.retreatBooking.count({
      where: {
        roomOptionId,
        ...activeBookingWhere,
      },
    }),
    tx.giftPurchase.count({
      where: {
        retreatRoomOptionId: roomOptionId,
        ...giftWhere,
      },
    }),
  ]);
  if (optionBookingCount + optionGiftCount + requestedBookings > option.capacity) {
    throw new Error("ROOM_OPTION_UNAVAILABLE");
  }
  if (!option.inventoryPoolId || !option.inventoryPool) return;

  const [bookingItems, legacyBookings, gifts] = await Promise.all([
    tx.retreatBookingItem.aggregate({
      where: {
        inventoryPoolId: option.inventoryPoolId,
        itemType: {
          in: [RetreatBookingItemType.accommodation, RetreatBookingItemType.online_live_place],
        },
        booking: activeBookingWhere,
      },
      _sum: { quantity: true },
    }),
    tx.retreatBooking.findMany({
      where: {
        roomOption: { inventoryPoolId: option.inventoryPoolId },
        ...activeBookingWhere,
        items: {
          none: {
            itemType: {
              in: [RetreatBookingItemType.accommodation, RetreatBookingItemType.online_live_place],
            },
          },
        },
      },
      select: { roomOption: { select: { inventoryUnitsPerBooking: true } } },
    }),
    tx.giftPurchase.findMany({
      where: {
        retreatRoomOption: { inventoryPoolId: option.inventoryPoolId },
        ...giftWhere,
      },
      select: { retreatRoomOption: { select: { inventoryUnitsPerBooking: true } } },
    }),
  ]);
  const reservedPoolUnits =
    (bookingItems._sum.quantity || 0) +
    legacyBookings.reduce(
      (sum, booking) => sum + (booking.roomOption?.inventoryUnitsPerBooking || 1),
      0
    ) +
    gifts.reduce((sum, gift) => sum + (gift.retreatRoomOption?.inventoryUnitsPerBooking || 1), 0);
  const requestedPoolUnits =
    Math.max(Math.trunc(requestedBookings), 1) * Math.max(option.inventoryUnitsPerBooking, 1);
  if (reservedPoolUnits + requestedPoolUnits > option.inventoryPool.totalQuantity) {
    throw new Error("ROOM_OPTION_UNAVAILABLE");
  }
}

async function assertAddonInventoryAvailableForUpdate(
  tx: Prisma.TransactionClient,
  addonId: string,
  requestedQuantity: number,
  totalQuantity: number | null
) {
  if (totalQuantity === null) return;
  await lockRetreatResource(tx, `retreat-addon:${addonId}`);
  const now = new Date();
  const reserved = await tx.retreatBookingItem.aggregate({
    where: {
      addonId,
      booking: {
        OR: [
          { bookingStatus: { in: ACTIVE_RETREAT_BOOKING_STATUSES } },
          {
            bookingStatus: RetreatBookingStatus.pending,
            createdAt: { gt: new Date(now.getTime() - RETREAT_PAYMENT_WINDOW_MS) },
          },
        ],
      },
    },
    _sum: { quantity: true },
  });
  if ((reserved._sum.quantity || 0) + requestedQuantity > totalQuantity) {
    throw new Error("RETREAT_ADDON_UNAVAILABLE");
  }
}

async function assertRetreatCapacityAvailableForUpdate(
  tx: Prisma.TransactionClient,
  retreatDateId: string,
  requestedGuests: number,
  capacity: number
) {
  await lockRetreatResource(tx, `retreat-date:${retreatDateId}`);
  const now = new Date();
  const [bookings, gifts] = await Promise.all([
    tx.retreatBooking.aggregate({
      where: {
        retreatDateId,
        OR: [
          { bookingStatus: { in: ACTIVE_RETREAT_BOOKING_STATUSES } },
          {
            bookingStatus: RetreatBookingStatus.pending,
            createdAt: { gt: new Date(now.getTime() - RETREAT_PAYMENT_WINDOW_MS) },
          },
        ],
      },
      _sum: { attendeeCount: true },
    }),
    tx.giftPurchase.aggregate({
      where: {
        retreatDateId,
        OR: [
          { status: GiftPurchaseStatus.purchased },
          {
            status: GiftPurchaseStatus.pending_payment,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      _sum: { retreatGuestCount: true },
    }),
  ]);
  const reservedGuests = (bookings._sum.attendeeCount || 0) + (gifts._sum.retreatGuestCount || 0);
  if (reservedGuests + Math.max(requestedGuests, 1) > capacity) {
    throw new Error("RETREAT_CAPACITY_UNAVAILABLE");
  }
}

type OperationalRetreatDate = Prisma.RetreatDateGetPayload<{
  include: {
    roomOptions: { include: { ratePlans: true; inventoryPool: true } };
    bookings: { include: { items: true } };
    depositRules: true;
    addons: { include: { inventoryPool: true } };
    giftPurchases: true;
  };
}>;

function mapOperationalAddon(addon: OperationalRetreatDate["addons"][number], reserved: number) {
  return {
    id: addon.id,
    name: addon.name,
    description: addon.description || undefined,
    pricePence: addon.pricePence,
    currency: addon.currency,
    availableQuantity: addon.inventoryPool
      ? Math.max(addon.inventoryPool.totalQuantity - reserved, 0)
      : null,
    requiresTimeSlot: addon.requiresTimeSlot,
  };
}

function toPublicRoomType(value: string): RetreatRoomOptionContent["type"] {
  if (
    value === "shared_twin" ||
    value === "single" ||
    value === "shared_private" ||
    value === "virtual"
  ) {
    return value;
  }
  return "shared_twin";
}

function mapOperationalRoomOption(
  roomOption: OperationalRetreatDate["roomOptions"][number],
  reservedBookings: number,
  reservedPoolUnits: number
): RetreatRoomOptionContent {
  const ratePlans = roomOption.ratePlans
    .filter((ratePlan) => ratePlan.active)
    .sort((a, b) => a.guestCount - b.guestCount)
    .map((ratePlan) => ({
      id: ratePlan.id,
      guestCount: ratePlan.guestCount,
      totalPricePence: ratePlan.totalPricePence,
      earlyBirdPricePence: ratePlan.earlyBirdPricePence ?? undefined,
      earlyBirdEndsAt: ratePlan.earlyBirdEndsAt?.toISOString(),
      currency: ratePlan.currency,
    }));
  const allowedGuestCounts = Array.isArray(roomOption.allowedGuestCountsJson)
    ? roomOption.allowedGuestCountsJson.filter(
        (count): count is number => typeof count === "number"
      )
    : ratePlans.map((ratePlan) => ratePlan.guestCount);
  return {
    id: roomOption.externalRoomOptionId,
    label: roomOption.label,
    description: roomOption.description || "",
    type: toPublicRoomType(roomOption.roomType),
    bookingUnit: roomOption.bookingUnit,
    inventoryUnitsPerBooking: roomOption.inventoryUnitsPerBooking,
    guestsIncluded: roomOption.guestsIncluded,
    guestCountPerUnit: roomOption.guestCountPerUnit ?? undefined,
    allowedGuestCounts,
    capacity: roomOption.capacity,
    availableSpots: getRetreatOptionAvailability({
      optionCapacity: roomOption.capacity,
      reservedOptionBookings: reservedBookings,
      poolTotalUnits: roomOption.inventoryPool?.totalQuantity,
      reservedPoolUnits,
      inventoryUnitsPerBooking: roomOption.inventoryUnitsPerBooking,
    }),
    normalPricePence: ratePlans[0]?.totalPricePence ?? roomOption.pricePence,
    ratePlans,
    pricePerPersonPence: roomOption.pricePerPersonPence ?? undefined,
    roomCount: roomOption.roomCount || undefined,
    depositPence: roomOption.depositAmountPence ?? undefined,
    isWaitlistOnly: roomOption.isWaitlistOnly,
  };
}

function getSoonestEarlyBirdEndsAt(dates: OperationalRetreatDate[]) {
  const endings = dates
    .flatMap((date) =>
      date.roomOptions.flatMap((roomOption) =>
        roomOption.ratePlans
          .filter(
            (ratePlan) =>
              ratePlan.active &&
              typeof ratePlan.earlyBirdPricePence === "number" &&
              ratePlan.earlyBirdPricePence < ratePlan.totalPricePence &&
              ratePlan.earlyBirdEndsAt &&
              ratePlan.earlyBirdEndsAt.getTime() > Date.now()
          )
          .map((ratePlan) => ratePlan.earlyBirdEndsAt)
      )
    )
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());
  return endings[0] || null;
}

async function mapOperationalDate(
  date: OperationalRetreatDate
): Promise<RetreatCombinedContent["dates"][number]> {
  const reservedRoomBookings = new Map<string, number>();
  const reservedPoolUnits = new Map<string, number>();
  const reservedAddonUnits = new Map<string, number>();

  for (const booking of date.bookings) {
    if (booking.roomOptionId) {
      reservedRoomBookings.set(
        booking.roomOptionId,
        (reservedRoomBookings.get(booking.roomOptionId) || 0) + 1
      );
    }
    const inventoryItems = booking.items.filter(
      (item) =>
        item.itemType === RetreatBookingItemType.accommodation ||
        item.itemType === RetreatBookingItemType.online_live_place
    );
    if (inventoryItems.length > 0) {
      for (const item of inventoryItems) {
        if (!item.roomOptionId) continue;
        if (item.inventoryPoolId) {
          reservedPoolUnits.set(
            item.inventoryPoolId,
            (reservedPoolUnits.get(item.inventoryPoolId) || 0) + item.quantity
          );
        }
      }
    } else if (booking.roomOptionId) {
      const option = date.roomOptions.find((candidate) => candidate.id === booking.roomOptionId);
      if (option?.inventoryPoolId) {
        reservedPoolUnits.set(
          option.inventoryPoolId,
          (reservedPoolUnits.get(option.inventoryPoolId) || 0) + option.inventoryUnitsPerBooking
        );
      }
    }

    for (const item of booking.items) {
      if (!item.addonId) continue;
      reservedAddonUnits.set(
        item.addonId,
        (reservedAddonUnits.get(item.addonId) || 0) + item.quantity
      );
    }
  }

  for (const gift of date.giftPurchases) {
    if (!gift.retreatRoomOptionId) continue;
    const option = date.roomOptions.find((candidate) => candidate.id === gift.retreatRoomOptionId);
    reservedRoomBookings.set(
      gift.retreatRoomOptionId,
      (reservedRoomBookings.get(gift.retreatRoomOptionId) || 0) + 1
    );
    if (option?.inventoryPoolId) {
      reservedPoolUnits.set(
        option.inventoryPoolId,
        (reservedPoolUnits.get(option.inventoryPoolId) || 0) + option.inventoryUnitsPerBooking
      );
    }
  }

  const roomOptions = date.roomOptions.map((roomOption) =>
    mapOperationalRoomOption(
      roomOption,
      reservedRoomBookings.get(roomOption.id) || 0,
      roomOption.inventoryPoolId ? reservedPoolUnits.get(roomOption.inventoryPoolId) || 0 : 0
    )
  );
  const addons = date.addons
    .filter((addon) => addon.active)
    .map((addon) => mapOperationalAddon(addon, reservedAddonUnits.get(addon.id) || 0));
  const bookedSpaces =
    date.bookings.reduce(
      (sum, booking) => sum + Math.max(booking.attendeeCount || booking.guestsIncluded || 1, 1),
      0
    ) + date.giftPurchases.reduce((sum, gift) => sum + Math.max(gift.retreatGuestCount || 1, 1), 0);
  const activeDepositRule = date.depositRules.find((rule) => rule.active);
  const paymentPolicy =
    activeDepositRule?.depositType === RetreatDepositType.full_payment ? "full_payment" : "deposit";

  return {
    id: date.externalDateId,
    retreatType: parseRetreatType(date.retreatType),
    timezone: date.timezone,
    startDate: date.startsAt.toISOString(),
    endDate: date.endsAt.toISOString(),
    availableSpaces: Math.max(date.capacity - bookedSpaces, 0),
    totalSpaces: date.capacity,
    roomOptions,
    addons,
    paymentPlan: undefined,
    paymentPolicy,
    payInFullDiscountEnabled: date.payInFullDiscountEnabled,
    refundNotes: undefined,
    onlineJoiningNotes: undefined,
    instructorProfileSlugs: undefined,
  };
}

function getTemplateVenue(
  template: RetreatTemplateContent,
  venues: RetreatVenueContent[]
): RetreatVenueContent | undefined {
  return venues.find(
    (venue) =>
      (template.venueId && venue.id === template.venueId) ||
      (template.venueSlug && venue.slug === template.venueSlug)
  );
}

async function buildOperationalRetreatFromTemplate(input: {
  template: RetreatTemplateContent;
  dates: OperationalRetreatDate[];
  venues: RetreatVenueContent[];
}): Promise<RetreatCombinedContent | null> {
  const mappedDates = await Promise.all(
    [...input.dates]
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .map(mapOperationalDate)
  );
  if (mappedDates.length === 0) return null;

  const firstDate = input.dates.reduce((earliest, date) =>
    date.startsAt < earliest.startsAt ? date : earliest
  );
  const earlyBirdEndsAt = getSoonestEarlyBirdEndsAt(input.dates);
  const venue = getTemplateVenue(input.template, input.venues);
  if (input.template.schedule.length === 0) {
    throw new Error(
      `CONTENTFUL_CONTENT_MISSING: retreatTemplate "${input.template.slug}" is missing its schedule`
    );
  }
  if (input.template.deliveryMode === "in_person" && !venue) {
    throw new Error(
      `CONTENTFUL_CONTENT_MISSING: retreatTemplate "${input.template.slug}" is missing its venue`
    );
  }

  return {
    id: input.template.id,
    slug: input.template.slug,
    title: input.template.title,
    subtitle: input.template.subtitle,
    location:
      venue?.displayLocation ||
      venue?.name ||
      firstDate.retreatLocationSnapshot ||
      "Location to be confirmed",
    imageUrl: getRetreatImageSrc({
      imageUrl: input.template.imageUrl,
      retreatType: mappedDates[0]?.retreatType || null,
    }),
    shortDescription: input.template.shortDescription,
    fullDescription: input.template.fullDescription,
    dates: mappedDates,
    earlyBirdPrice: firstDate.pricePence / 100,
    earlyBirdDeadline:
      earlyBirdEndsAt?.toISOString() ||
      firstDate.bookingClosesAt?.toISOString() ||
      firstDate.balanceDueAt?.toISOString() ||
      firstDate.startsAt.toISOString(),
    normalPrice: firstDate.pricePence / 100,
    currency: firstDate.currency,
    included: input.template.included,
    notIncluded: input.template.notIncluded,
    schedule: input.template.schedule,
    accommodation:
      input.template.accommodationDescription ||
      venue?.accommodationType ||
      venue?.description ||
      "",
    suitableFor: input.template.suitableFor,
    experienceType: input.template.experienceType,
    deliveryMode: input.template.deliveryMode,
    durationLabel: input.template.durationLabel,
    audienceDescription: input.template.audienceDescription,
    experienceLevel: input.template.experienceLevel,
    foodAndDrinkDescription: input.template.foodAndDrinkDescription,
    whatToBring: input.template.whatToBring,
    seoTitle: input.template.seoTitle,
    seoDescription: input.template.seoDescription,
    venueId: venue?.id,
    venueSlug: venue?.slug,
    venueName: venue?.name,
    venue,
  };
}

async function getBookableOperationalDates(slug?: string): Promise<OperationalRetreatDate[]> {
  const now = new Date();
  const activeBookingWhere: Prisma.RetreatBookingWhereInput = {
    OR: [
      { bookingStatus: { in: ACTIVE_RETREAT_BOOKING_STATUSES } },
      {
        bookingStatus: RetreatBookingStatus.pending,
        createdAt: { gt: new Date(now.getTime() - RETREAT_PAYMENT_WINDOW_MS) },
      },
    ],
  };
  return db.retreatDate.findMany({
    where: {
      ...(slug ? { retreatSlug: slug } : {}),
      status: { in: ["open", "sold_out"] },
      endsAt: { gte: now },
      AND: [
        { OR: [{ bookingOpensAt: null }, { bookingOpensAt: { lte: now } }] },
        { OR: [{ bookingClosesAt: null }, { bookingClosesAt: { gt: now } }] },
      ],
    },
    include: {
      roomOptions: {
        where: { active: true },
        include: {
          ratePlans: { where: { active: true }, orderBy: { guestCount: "asc" } },
          inventoryPool: true,
        },
        orderBy: { displayOrder: "asc" },
      },
      bookings: {
        where: activeBookingWhere,
        include: { items: true },
      },
      depositRules: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
      },
      addons: {
        where: { active: true },
        include: { inventoryPool: true },
        orderBy: { createdAt: "asc" },
      },
      giftPurchases: {
        where: {
          OR: [
            { status: GiftPurchaseStatus.purchased },
            {
              status: GiftPurchaseStatus.pending_payment,
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
          ],
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });
}

export async function syncRetreatDateFromContent(slug: string, externalDateId: string) {
  const { retreat, instance } = await getRetreatAndInstance(slug, externalDateId);
  const startsAt = parseIsoDate(instance.startDate);
  const endsAt = parseIsoDate(instance.endDate);
  const retreatType = parseRetreatType(instance.retreatType);
  const earlyBirdEndsAt = parseIsoDate(retreat.earlyBirdDeadline);
  const basePricePence = retreat.normalPrice * 100;
  const depositAmountPence = getDepositAmountPence(basePricePence);
  const balanceDueAt = getBalanceDueDate(startsAt);
  const refundPolicySnapshot = getRetreatRefundPolicySnapshot({
    retreatType,
    totalPence: basePricePence,
    depositPence: depositAmountPence,
    startsAt,
  });

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
      refundPolicySnapshotJson: toPrismaJson(refundPolicySnapshot),
      payInFullDiscountEnabled: instance.payInFullDiscountEnabled !== false,
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
      refundPolicySnapshotJson: toPrismaJson(refundPolicySnapshot),
      payInFullDiscountEnabled: instance.payInFullDiscountEnabled !== false,
    },
  });

  for (const roomOption of instance.roomOptions) {
    const roomPricePence = roomOption.normalPricePence;
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
        bookingUnit:
          roomOption.bookingUnit === "whole_room"
            ? RetreatBookingUnit.whole_room
            : roomOption.bookingUnit === "online_live_place"
              ? RetreatBookingUnit.online_live_place
              : RetreatBookingUnit.bed_space,
        inventoryUnitsPerBooking: roomOption.inventoryUnitsPerBooking ?? 1,
        guestsIncluded: roomOption.guestsIncluded,
        guestCountPerUnit: roomOption.guestCountPerUnit ?? null,
        physicalRoomCount: undefined,
        bedsPerPhysicalRoom: undefined,
        allowedGuestCountsJson: toPrismaJson(roomOption.allowedGuestCounts),
        capacity: roomOption.capacity,
        availableSpots: roomOption.availableSpots,
        pricePence: roomPricePence,
        pricePerPersonPence: roomOption.pricePerPersonPence,
        roomCount: roomOption.roomCount || 0,
        depositAmountPence: roomDepositPence,
        isWaitlistOnly: roomOption.isWaitlistOnly === true,
      },
      update: {
        label: roomOption.label,
        description: roomOption.description,
        roomType: roomOption.type,
        bookingUnit:
          roomOption.bookingUnit === "whole_room"
            ? RetreatBookingUnit.whole_room
            : roomOption.bookingUnit === "online_live_place"
              ? RetreatBookingUnit.online_live_place
              : RetreatBookingUnit.bed_space,
        inventoryUnitsPerBooking: roomOption.inventoryUnitsPerBooking ?? 1,
        guestsIncluded: roomOption.guestsIncluded,
        guestCountPerUnit: roomOption.guestCountPerUnit ?? null,
        allowedGuestCountsJson: toPrismaJson(roomOption.allowedGuestCounts),
        capacity: roomOption.capacity,
        availableSpots: roomOption.availableSpots,
        pricePence: roomPricePence,
        pricePerPersonPence: roomOption.pricePerPersonPence,
        roomCount: roomOption.roomCount || 0,
        depositAmountPence: roomDepositPence,
        isWaitlistOnly: roomOption.isWaitlistOnly === true,
      },
    });

    const roomRatePlans =
      roomOption.ratePlans && roomOption.ratePlans.length > 0
        ? roomOption.ratePlans
        : [
            {
              id: `${roomOption.id}-1`,
              guestCount: roomOption.guestsIncluded,
              totalPricePence: roomOption.normalPricePence,
              earlyBirdPricePence: roomOption.earlyBirdPricePence,
              earlyBirdEndsAt: retreat.earlyBirdDeadline,
              currency: retreat.currency,
            },
          ];

    for (const ratePlan of roomRatePlans) {
      await db.retreatRatePlan.upsert({
        where: {
          roomOptionId_guestCount: {
            roomOptionId: syncedRoomOption.id,
            guestCount: ratePlan.guestCount,
          },
        },
        create: {
          id: ratePlan.id ? `sync_${retreat.slug}_${instance.id}_${ratePlan.id}` : undefined,
          roomOptionId: syncedRoomOption.id,
          guestCount: ratePlan.guestCount,
          totalPricePence: ratePlan.totalPricePence,
          earlyBirdPricePence:
            typeof ratePlan.earlyBirdPricePence === "number" ? ratePlan.earlyBirdPricePence : null,
          earlyBirdEndsAt:
            typeof ratePlan.earlyBirdPricePence === "number"
              ? ratePlan.earlyBirdEndsAt
                ? parseIsoDate(ratePlan.earlyBirdEndsAt)
                : earlyBirdEndsAt
              : null,
          currency: ratePlan.currency || retreat.currency,
        },
        update: {
          totalPricePence: ratePlan.totalPricePence,
          earlyBirdPricePence:
            typeof ratePlan.earlyBirdPricePence === "number" ? ratePlan.earlyBirdPricePence : null,
          earlyBirdEndsAt:
            typeof ratePlan.earlyBirdPricePence === "number"
              ? ratePlan.earlyBirdEndsAt
                ? parseIsoDate(ratePlan.earlyBirdEndsAt)
                : earlyBirdEndsAt
              : null,
          currency: ratePlan.currency || retreat.currency,
          active: true,
        },
      });
    }

    if (retreatType === "in_person" && roomOption.roomCount && roomOption.roomCount > 0) {
      for (let index = 1; index <= roomOption.roomCount; index += 1) {
        await db.retreatRoomUnit.upsert({
          where: {
            retreatDateId_roomOptionId_label: {
              retreatDateId: retreatDate.id,
              roomOptionId: syncedRoomOption.id,
              label: `${roomOption.label} ${index}`,
            },
          },
          create: {
            retreatDateId: retreatDate.id,
            roomOptionId: syncedRoomOption.id,
            label: `${roomOption.label} ${index}`,
            capacityUnits:
              syncedRoomOption.bookingUnit === RetreatBookingUnit.bed_space
                ? Math.max(syncedRoomOption.bedsPerPhysicalRoom || 1, 1)
                : 1,
            inventoryPoolId: syncedRoomOption.inventoryPoolId,
          },
          update: {
            inventoryPoolId: syncedRoomOption.inventoryPoolId,
            capacityUnits:
              syncedRoomOption.bookingUnit === RetreatBookingUnit.bed_space
                ? Math.max(syncedRoomOption.bedsPerPhysicalRoom || 1, 1)
                : 1,
          },
        });
      }
    }
  }

  return db.retreatDate.findUniqueOrThrow({
    where: { id: retreatDate.id },
    include: { roomOptions: { include: { ratePlans: true } } },
  });
}

async function getSyncedRetreatDateAndRoomOption(input: {
  retreatSlug: string;
  retreatDateId: string;
  roomOptionId: string;
}) {
  const retreatDate = await db.retreatDate.findFirstOrThrow({
    where: {
      retreatSlug: input.retreatSlug,
      externalDateId: input.retreatDateId,
    },
    include: {
      roomOptions: { include: { ratePlans: true } },
      depositRules: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
      },
      addons: {
        where: { active: true },
        include: { inventoryPool: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (retreatDate.status !== "open") {
    throw new Error("RETREAT_DATE_UNAVAILABLE");
  }
  const now = new Date();
  if (
    (retreatDate.bookingOpensAt && retreatDate.bookingOpensAt > now) ||
    (retreatDate.bookingClosesAt && retreatDate.bookingClosesAt <= now) ||
    retreatDate.endsAt <= now
  ) {
    throw new Error("RETREAT_BOOKING_WINDOW_CLOSED");
  }

  const roomOption =
    retreatDate.roomOptions.find((item) => item.externalRoomOptionId === input.roomOptionId) ||
    null;
  if (!roomOption) {
    throw new Error("ROOM_OPTION_NOT_FOUND");
  }

  const availableSpots = await getRoomAvailability(roomOption.id);
  if (roomOption.isWaitlistOnly || availableSpots <= 0) {
    throw new Error("ROOM_OPTION_UNAVAILABLE");
  }

  return { retreatDate, roomOption, availableSpots };
}

export async function getOperationalRetreatBySlug(
  slug: string
): Promise<RetreatCombinedContent | null> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag("retreats-public");

  const [templates, venues, operationalDates] = await Promise.all([
    getRetreatTemplates(),
    getRetreatVenues(),
    getBookableOperationalDates(slug),
  ]);
  if (operationalDates.length === 0) return null;
  const template = templates.find((item) => item.slug === slug);
  if (!template) {
    throw new Error(`CONTENTFUL_CONTENT_MISSING: retreatTemplate "${slug}" is not published`);
  }
  return buildOperationalRetreatFromTemplate({ template, dates: operationalDates, venues });
}

export async function listOperationalRetreats(): Promise<RetreatCombinedContent[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag("retreats-public");

  const [templates, venues, operationalDates] = await Promise.all([
    getRetreatTemplates(),
    getRetreatVenues(),
    getBookableOperationalDates(),
  ]);
  const templateBySlug = new Map(templates.map((template) => [template.slug, template]));
  const operationalDatesBySlug = new Map<string, OperationalRetreatDate[]>();

  for (const date of operationalDates) {
    const current = operationalDatesBySlug.get(date.retreatSlug) ?? [];
    current.push(date);
    operationalDatesBySlug.set(date.retreatSlug, current);
  }

  const slugs = new Set(operationalDatesBySlug.keys());
  const mergedRetreats = await Promise.all(
    [...slugs].map(async (slug) => {
      const dates = operationalDatesBySlug.get(slug) ?? [];
      const template = templateBySlug.get(slug);
      if (!template || template.schedule.length === 0) return null;
      if (template.deliveryMode === "in_person" && !getTemplateVenue(template, venues)) return null;
      return buildOperationalRetreatFromTemplate({ template, dates, venues });
    })
  );

  return mergedRetreats.filter((retreat): retreat is RetreatCombinedContent => Boolean(retreat));
}

export async function createRetreatCheckout(input: {
  retreatSlug: string;
  retreatDateId: string;
  roomOptionId: string;
  guestCount?: number;
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
  paymentOption?: "deposit" | "pay_in_full";
  addons?: Array<{ addonId: string; quantity: number }>;
}) {
  if (input.purchaserUserId) {
    const purchaser = await db.user.findUnique({
      where: { id: input.purchaserUserId },
      select: { id: true, deletedAt: true },
    });
    if (!purchaser || purchaser.deletedAt) {
      throw new Error("USER_NOT_FOUND");
    }
    await assertNoUserCheckoutDisputeHold(input.purchaserUserId);
  }

  const acceptanceStates = input.purchaserUserId
    ? await assertCurrentAcceptances(
        input.purchaserUserId,
        input.purchaseMode === "gift"
          ? [{ type: AcceptanceType.terms, surface: "retreat_gift_checkout" }]
          : [
              { type: AcceptanceType.terms, surface: "retreat_checkout" },
              { type: AcceptanceType.health_waiver, surface: "retreat_checkout" },
              { type: AcceptanceType.health_data, surface: "retreat_checkout" },
            ]
      )
    : null;

  if (!input.purchaserUserId) {
    const guestAcceptanceTypes =
      input.purchaseMode === "gift"
        ? [AcceptanceType.terms]
        : [AcceptanceType.terms, AcceptanceType.health_waiver, AcceptanceType.health_data];
    const guestPolicies = await getCurrentPolicyVersions(guestAcceptanceTypes);
    const currentGuestVersions = new Map(
      guestAcceptanceTypes.map((type, index) => [type, guestPolicies[index]?.version || ""])
    );
    if (
      input.acceptedTermsVersion !== currentGuestVersions.get(AcceptanceType.terms) ||
      (input.purchaseMode === "self" &&
        (input.acceptedHealthWaiverVersion !==
          currentGuestVersions.get(AcceptanceType.health_waiver) ||
          input.acceptedHealthDataVersion !== currentGuestVersions.get(AcceptanceType.health_data)))
    ) {
      throw new Error("RETREAT_LEGAL_ACCEPTANCE_REQUIRED");
    }
  }

  const { retreatDate, roomOption } = await getSyncedRetreatDateAndRoomOption({
    retreatSlug: input.retreatSlug,
    retreatDateId: input.retreatDateId,
    roomOptionId: input.roomOptionId,
  });
  const selectedGuestCount = Math.max(Math.trunc(input.guestCount || roomOption.guestsIncluded), 1);
  const ratePlans =
    roomOption.ratePlans.length > 0
      ? roomOption.ratePlans.map((ratePlan) => ({
          id: ratePlan.id,
          guestCount: ratePlan.guestCount,
          totalPricePence: ratePlan.totalPricePence,
          earlyBirdPricePence: ratePlan.earlyBirdPricePence,
          earlyBirdEndsAt: ratePlan.earlyBirdEndsAt,
          currency: ratePlan.currency,
          active: ratePlan.active,
        }))
      : [
          {
            id: `${roomOption.id}-default-rate`,
            guestCount: roomOption.guestsIncluded,
            totalPricePence: roomOption.pricePence,
            earlyBirdPricePence: null,
            earlyBirdEndsAt: null,
            currency: retreatDate.currency,
            active: true,
          },
        ];
  const allowedGuestCounts = Array.isArray(roomOption.allowedGuestCountsJson)
    ? roomOption.allowedGuestCountsJson.filter(
        (count): count is number => typeof count === "number"
      )
    : ratePlans.map((ratePlan) => ratePlan.guestCount);
  const selectedRatePlan = ratePlans.find((ratePlan) => ratePlan.guestCount === selectedGuestCount);
  const selectedTotalPricePence = selectedRatePlan
    ? getEffectiveRetreatRatePricePence(selectedRatePlan)
    : roomOption.pricePence;
  const configuredDepositRule = retreatDate.depositRules.find((rule) => rule.active);
  const depositRule: RetreatDepositRuleInput =
    configuredDepositRule?.depositType === RetreatDepositType.full_payment
      ? { depositType: "full_payment" }
      : configuredDepositRule?.depositType === RetreatDepositType.percentage &&
          configuredDepositRule.depositPercentageBasisPoints
        ? {
            depositType: "percentage",
            depositPercentageBasisPoints: configuredDepositRule.depositPercentageBasisPoints,
          }
        : configuredDepositRule?.depositType === RetreatDepositType.fixed_amount &&
            configuredDepositRule.fixedDepositAmountPence !== null
          ? {
              depositType: "fixed_amount",
              fixedDepositAmountPence: configuredDepositRule.fixedDepositAmountPence,
            }
          : {
              depositType: "fixed_amount",
              fixedDepositAmountPence:
                roomOption.depositAmountPence && roomOption.pricePence > 0
                  ? Math.min(
                      selectedTotalPricePence,
                      Math.round(
                        (selectedTotalPricePence * roomOption.depositAmountPence) /
                          roomOption.pricePence
                      )
                    )
                  : getDepositAmountPence(selectedTotalPricePence),
            };
  const requiresFullPayment = depositRule.depositType === "full_payment";
  const effectivePaymentOption = requiresFullPayment
    ? "pay_in_full"
    : (input.paymentOption ?? "deposit");
  const quote = quoteRetreatAccommodation({
    bookingUnit: roomOption.bookingUnit,
    quantity: 1,
    inventoryUnitsPerBooking: roomOption.inventoryUnitsPerBooking,
    guestCount: selectedGuestCount,
    allowedGuestCounts,
    guestCountPerUnit: roomOption.guestCountPerUnit,
    ratePlans,
    depositRule,
    currency: retreatDate.currency,
  });
  const addonSelections = (input.addons || []).map((selection) => ({
    addonId: normalizeText(selection.addonId, 120),
    quantity: Math.trunc(selection.quantity),
  }));
  if (
    new Set(addonSelections.map((selection) => selection.addonId)).size !==
      addonSelections.length ||
    addonSelections.some(
      (selection) => !selection.addonId || selection.quantity < 1 || selection.quantity > 10
    )
  ) {
    throw new Error("RETREAT_ADDON_INVALID");
  }
  if (input.purchaseMode === "gift" && addonSelections.length > 0) {
    throw new Error("RETREAT_GIFT_ADDONS_UNSUPPORTED");
  }
  const selectedAddons = addonSelections.map((selection) => {
    const addon = retreatDate.addons.find((candidate) => candidate.id === selection.addonId);
    if (!addon || addon.currency !== retreatDate.currency || addon.requiresTimeSlot) {
      throw new Error("RETREAT_ADDON_INVALID");
    }
    return {
      ...selection,
      addon,
      totalPricePence: addon.pricePence * selection.quantity,
    };
  });
  const addonTotalPence = selectedAddons.reduce(
    (sum, selection) => sum + selection.totalPricePence,
    0
  );

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

    const giftPayInFullDiscountPence = calculatePayInFullDiscount(
      quote.totalPricePence,
      !requiresFullPayment && retreatDate.payInFullDiscountEnabled,
      retreatDate.payInFullDiscountPercent,
      retreatDate.payInFullDiscountCapPence
    );
    const giftTotalPence = Math.max(quote.totalPricePence - giftPayInFullDiscountPence, 0);
    const giftNonRefundableAmountPence = calculateRetreatNonRefundableAmount({
      retreatType: parseRetreatType(retreatDate.retreatType),
      totalPence: giftTotalPence,
      depositPence: Math.min(quote.depositPence, giftTotalPence),
    });

    const gift = await db.$transaction(async (tx) => {
      await assertRetreatCapacityAvailableForUpdate(
        tx,
        retreatDate.id,
        quote.totalGuestCount,
        retreatDate.capacity
      );
      await assertRoomInventoryAvailableForUpdate(tx, roomOption.id, 1);
      return tx.giftPurchase.create({
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
          totalPaidPence: giftTotalPence,
          nonRefundableAmountPence: giftNonRefundableAmountPence,
          retreatDateId: retreatDate.id,
          retreatRoomOptionId: roomOption.id,
          retreatRatePlanId:
            selectedRatePlan && roomOption.ratePlans.some((plan) => plan.id === selectedRatePlan.id)
              ? selectedRatePlan.id
              : undefined,
          retreatGuestCount: quote.totalGuestCount,
          expiresAt: new Date(Date.now() + RETREAT_PAYMENT_WINDOW_MS),
        },
      });
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
            unit_amount: giftTotalPence,
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
        payInFullDiscountPence: String(giftPayInFullDiscountPence),
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

  const payInFullDiscountPence = calculatePayInFullDiscount(
    quote.totalPricePence,
    effectivePaymentOption === "pay_in_full" &&
      !requiresFullPayment &&
      retreatDate.payInFullDiscountEnabled,
    retreatDate.payInFullDiscountPercent,
    retreatDate.payInFullDiscountCapPence
  );
  const payableAccommodationPence = Math.max(0, quote.totalPricePence - payInFullDiscountPence);
  const payableTotalPence = payableAccommodationPence + addonTotalPence;
  const accommodationDepositPence = Math.min(quote.depositPence, payableAccommodationPence);
  const retreatType = parseRetreatType(retreatDate.retreatType);
  const refundDepositPence =
    requiresFullPayment && retreatType === "in_person"
      ? 0
      : accommodationDepositPence + addonTotalPence;
  const refundPolicySnapshot = getRetreatRefundPolicySnapshot({
    retreatType,
    totalPence: payableTotalPence,
    depositPence: refundDepositPence,
    startsAt: retreatDate.startsAt,
  });
  const nonRefundableAmountPence = refundPolicySnapshot.nonRefundableAmountPence;
  const paymentPlan = retreatDate.paymentPlanSnapshotJson as RetreatPaymentPlan | null;
  const instalmentDrafts = buildRetreatInstalmentPlan({
    totalPence: payableAccommodationPence,
    depositPence: accommodationDepositPence,
    startsAt: retreatDate.startsAt,
    paymentPlan,
    payInFull: effectivePaymentOption === "pay_in_full",
  }).map((instalment, index) =>
    index === 0
      ? { ...instalment, amountPence: instalment.amountPence + addonTotalPence }
      : instalment
  );
  const initialInstalment = instalmentDrafts[0];
  if (!initialInstalment) {
    throw new Error("RETREAT_PAYMENT_PLAN_INVALID");
  }
  const balanceAmountPence = Math.max(
    0,
    instalmentDrafts.slice(1).reduce((sum, instalment) => sum + instalment.amountPence, 0)
  );

  const booking = await db.$transaction(async (tx) => {
    await assertRetreatCapacityAvailableForUpdate(
      tx,
      retreatDate.id,
      quote.totalGuestCount,
      retreatDate.capacity
    );
    await assertRoomInventoryAvailableForUpdate(tx, roomOption.id, quote.quantity);
    for (const selection of selectedAddons) {
      await assertAddonInventoryAvailableForUpdate(
        tx,
        selection.addon.id,
        selection.quantity,
        selection.addon.inventoryPool?.totalQuantity ?? null
      );
    }
    return tx.retreatBooking.create({
      data: {
        retreatDateId: retreatDate.id,
        roomOptionId: roomOption.id,
        purchaserUserId: input.purchaserUserId || undefined,
        attendeeUserId:
          input.purchaserUserId && attendeeEmail === purchaserEmail
            ? input.purchaserUserId
            : undefined,
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
        attendeeCount: quote.totalGuestCount,
        singleRoomRequested: roomOption.roomType === "single",
        roomType: roomOption.label,
        roomOptionLabelSnapshot: roomOption.label,
        roomOptionTypeSnapshot: roomOption.roomType,
        guestsIncluded: quote.totalGuestCount,
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
        depositAmountPence: initialInstalment.amountPence,
        balanceAmountPence,
        currency: retreatDate.currency,
        bookingStatus: "pending",
        paymentStatus: "unpaid",
        balancePaymentUrlToken: balanceAmountPence > 0 ? createBalanceToken() : null,
        balanceDueAt: retreatDate.balanceDueAt,
        paymentPlanSnapshotJson: toPrismaJson(paymentPlan),
        refundPolicySnapshotJson: toPrismaJson(refundPolicySnapshot),
        instalments: {
          create: instalmentDrafts.map((instalment) => ({
            sequence: instalment.sequence,
            kind: instalment.kind as RetreatInstalmentKind,
            label: instalment.label,
            amountPence: instalment.amountPence,
            dueAt: instalment.dueAt,
            publicPaymentToken: instalment.sequence > 1 ? createBalanceToken() : null,
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
                  : createBalanceToken(),
              claimedAt:
                input.purchaserUserId && attendeeEmail === purchaserEmail ? new Date() : null,
            },
            ...(quote.totalGuestCount > 1 && input.guestTwoEmail
              ? [
                  {
                    email: normalizeEmail(input.guestTwoEmail),
                    firstName: normalizeText(input.guestTwoFirstName || "", 80),
                    lastName: normalizeText(input.guestTwoLastName || "", 80),
                    displayName:
                      `${normalizeText(input.guestTwoFirstName || "", 80)} ${normalizeText(
                        input.guestTwoLastName || "",
                        80
                      )}`.trim(),
                    isPrimary: false,
                    isPurchaser: normalizeEmail(input.guestTwoEmail) === purchaserEmail,
                    claimToken: createBalanceToken(),
                  },
                ]
              : []),
          ],
        },
        items: {
          create: [
            {
              itemType:
                retreatDate.retreatType === "online" ? "online_live_place" : "accommodation",
              inventoryPoolId: roomOption.inventoryPoolId,
              roomOptionId: roomOption.id,
              ratePlanId:
                selectedRatePlan &&
                roomOption.ratePlans.some((plan) => plan.id === selectedRatePlan.id)
                  ? selectedRatePlan.id
                  : undefined,
              quantity: quote.inventoryUnitsConsumed,
              guestCount: quote.totalGuestCount,
              unitPricePence: quote.unitPricePence,
              totalPricePence: payableAccommodationPence,
              currency: retreatDate.currency,
            },
            ...selectedAddons.map((selection) => ({
              itemType: "addon" as const,
              inventoryPoolId: selection.addon.inventoryPoolId,
              addonId: selection.addon.id,
              quantity: selection.quantity,
              guestCount: 0,
              unitPricePence: selection.addon.pricePence,
              totalPricePence: selection.totalPricePence,
              currency: selection.addon.currency,
            })),
          ],
        },
      },
      include: { retreatDate: true },
    });
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
            name: `${retreatDate.retreatTitleSnapshot} ${initialInstalment.label.toLowerCase()}`,
            description: `${roomOption.label}${selectedAddons.length ? ` + ${selectedAddons.length} extra${selectedAddons.length === 1 ? "" : "s"}` : ""} · ${formatDateRange(retreatDate.startsAt, retreatDate.endsAt)}`,
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
    include: {
      retreatDate: true,
      items: {
        where: { itemType: RetreatBookingItemType.addon },
        include: { addon: true },
      },
    },
  });
  if (!booking) return;

  const retreatDetailsUrl = buildAbsoluteUrl(`/retreats/${booking.retreatDate.retreatSlug}`);
  const paidInFull = booking.balanceAmountPence <= 0;
  const paidAmountLabel = paidInFull ? "Payment received" : "Deposit paid";
  const extras = booking.items.flatMap((item) =>
    item.addon ? [`${item.addon.name} × ${item.quantity}`] : []
  );
  await sendPostmarkReactEmail({
    to: booking.purchaserEmail,
    subject: `${booking.retreatDate.retreatTitleSnapshot}: ${
      paidInFull ? "payment received" : "deposit received"
    }`,
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
      paidInFull,
      extras,
    }),
    textBody: `${paidInFull ? "Payment" : "Deposit"} received for ${booking.retreatDate.retreatTitleSnapshot}\nDates: ${formatDateRange(booking.retreatDate.startsAt, booking.retreatDate.endsAt)}\n${paidAmountLabel}: ${formatCurrency(paidInFull ? booking.totalPricePence : booking.depositAmountPence, booking.currency)}\nRemaining balance: ${formatCurrency(booking.balanceAmountPence, booking.currency)}${extras.length ? `\nExtras: ${extras.join(", ")}` : ""}\nDetails: ${retreatDetailsUrl}`,
    tag: "retreat-deposit-confirmation",
    templateKey: "retreat-deposit-confirmation",
    metadata: {
      bookingId: booking.id,
      retreatSlug: booking.retreatDate.retreatSlug,
    },
    dispatchMode: "immediate_best_effort",
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
      templateKey: "retreat-balance-due",
      metadata: {
        bookingId: booking.id,
        retreatSlug: booking.retreatDate.retreatSlug,
      },
      dispatchMode: "immediate_best_effort",
    });
  }
}

async function sendRetreatBookingAdminNotification(bookingId: string) {
  const booking = await db.retreatBooking.findUnique({
    where: { id: bookingId },
    include: { retreatDate: true },
  });
  if (!booking) return;

  const paidPence = booking.depositPaidPence + booking.balancePaidPence;
  const paymentSummary = `${formatCurrency(paidPence, booking.currency)} received${
    booking.balanceAmountPence > 0
      ? `; ${formatCurrency(booking.balanceAmountPence, booking.currency)} remains`
      : "; paid in full"
  }.`;
  const adminUrl = buildAbsoluteUrl(`/admin/retreats/${booking.retreatDateId}`);
  await sendRetreatOperationalEmail({
    subject: `New booking: ${booking.retreatDate.retreatTitleSnapshot}`,
    react: RetreatBookingAdminEmail({
      purchaserName: `${booking.purchaserFirstName} ${booking.purchaserLastName}`.trim(),
      purchaserEmail: booking.purchaserEmail,
      retreatName: booking.retreatDate.retreatTitleSnapshot,
      retreatDates: formatDateRange(booking.retreatDate.startsAt, booking.retreatDate.endsAt),
      selection: booking.roomOptionLabelSnapshot || booking.roomType || "Retreat place",
      guestCount: booking.attendeeCount,
      paymentSummary,
      adminUrl,
    }),
    textBody: `New booking for ${booking.retreatDate.retreatTitleSnapshot}\nPurchaser: ${booking.purchaserFirstName} ${booking.purchaserLastName} (${booking.purchaserEmail})\nSelection: ${booking.roomOptionLabelSnapshot || booking.roomType || "Retreat place"}\nGuests: ${booking.attendeeCount}\n${paymentSummary}\nOpen: ${adminUrl}`,
    tag: "retreat-booking-admin",
    templateKey: "retreat-booking-admin",
    metadata: { bookingId: booking.id, retreatDateId: booking.retreatDateId },
    dispatchMode: "immediate_best_effort",
  });
}

async function sendRetreatPaymentReceipt(bookingId: string, amountPaidPence: number) {
  const booking = await db.retreatBooking.findUnique({
    where: { id: bookingId },
    include: { retreatDate: true },
  });
  if (!booking) return;

  const retreatDetailsUrl = buildAbsoluteUrl(`/dashboard/retreats/${booking.id}`);
  const totalPaidPence = booking.depositPaidPence + booking.balancePaidPence;
  await sendPostmarkReactEmail({
    to: booking.purchaserEmail,
    subject: `${booking.retreatDate.retreatTitleSnapshot}: payment received`,
    react: RetreatPaymentReceiptEmail({
      firstName: booking.purchaserFirstName,
      retreatName: booking.retreatDate.retreatTitleSnapshot,
      retreatDates: formatDateRange(booking.retreatDate.startsAt, booking.retreatDate.endsAt),
      amountPaid: formatCurrency(amountPaidPence, booking.currency),
      totalPaid: formatCurrency(totalPaidPence, booking.currency),
      retreatDetailsUrl,
    }),
    textBody: `Payment received for ${booking.retreatDate.retreatTitleSnapshot}\nAmount received: ${formatCurrency(amountPaidPence, booking.currency)}\nTotal paid: ${formatCurrency(totalPaidPence, booking.currency)}\nDetails: ${retreatDetailsUrl}`,
    tag: "retreat-payment-receipt",
    templateKey: "retreat-payment-receipt",
    metadata: { bookingId: booking.id, retreatDateId: booking.retreatDateId },
    dispatchMode: "immediate_best_effort",
  });
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

    const paymentApplied = await db.$transaction(async (tx) => {
      const claimed = await tx.retreatBookingInstalment.updateMany({
        where: {
          bookingId: booking.id,
          sequence: instalmentSequence,
          status: { not: RetreatInstalmentStatus.paid },
        },
        data: {
          status: RetreatInstalmentStatus.paid,
          paidAt,
          stripePaymentIntentId: paymentIntentId || undefined,
        },
      });
      if (claimed.count === 0) return false;

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
      const nonDepositInstalmentPaidPence = paidInstalments
        .filter(
          (instalment) =>
            instalment.kind !== RetreatInstalmentKind.deposit &&
            instalment.kind !== RetreatInstalmentKind.full_payment
        )
        .reduce((sum, instalment) => sum + instalment.amountPence, 0);
      const accountedDepositPaidPence = fullPaymentPaidPence
        ? Math.min(
            booking.nonRefundableAmountPence || booking.depositAmountPence,
            fullPaymentPaidPence
          )
        : depositPaidPence;
      const accountedBalancePaidPence = fullPaymentPaidPence
        ? Math.max(0, fullPaymentPaidPence - accountedDepositPaidPence) +
          nonDepositInstalmentPaidPence
        : nonDepositInstalmentPaidPence;
      const allPaid = instalments.every(
        (instalment) => instalment.status === RetreatInstalmentStatus.paid
      );
      const nonInitialPaymentMade = accountedBalancePaidPence > 0 && !allPaid;

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
          depositPaidPence: accountedDepositPaidPence,
          depositPaidAt:
            depositPaidPence > 0 || fullPaymentPaidPence > 0 ? paidAt : booking.depositPaidAt,
          balancePaidPence: accountedBalancePaidPence,
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
      return true;
    });

    if (!paymentApplied) return true;

    if (instalmentSequence === 1) {
      await assignRoomUnitAfterPayment(booking.id);
      await ensureRetreatOnlineAccessEntitlement(booking.id);
      await Promise.allSettled([
        sendDepositConfirmationEmail(booking.id),
        sendRetreatBookingAdminNotification(booking.id),
      ]);
    } else {
      const paidInstalment = await db.retreatBookingInstalment.findUnique({
        where: {
          bookingId_sequence: { bookingId: booking.id, sequence: instalmentSequence },
        },
        select: { amountPence: true },
      });
      if (paidInstalment) {
        await sendRetreatPaymentReceipt(booking.id, paidInstalment.amountPence).catch((error) => {
          console.error("Failed to send retreat payment receipt", error);
        });
      }
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

    const claimed = await db.retreatBooking.updateMany({
      where: {
        id: booking.id,
        paymentStatus: RetreatPaymentStatus.unpaid,
      },
      data: {
        paymentStatus,
        bookingStatus,
        depositPaidPence: booking.depositAmountPence,
        depositPaidAt: new Date(),
        stripeDepositPaymentIntentId: paymentIntentId || booking.stripeDepositPaymentIntentId,
      },
    });
    if (claimed.count === 0) return true;
    await assignRoomUnitAfterPayment(booking.id);
    await ensureRetreatOnlineAccessEntitlement(booking.id);
    await Promise.allSettled([
      sendDepositConfirmationEmail(booking.id),
      sendRetreatBookingAdminNotification(booking.id),
    ]);
    return true;
  }

  if (kind === "retreat_balance") {
    const amountPaidPence = booking.balanceAmountPence;
    const claimed = await db.retreatBooking.updateMany({
      where: {
        id: booking.id,
        paymentStatus: { not: RetreatPaymentStatus.paid_in_full },
      },
      data: {
        paymentStatus: RetreatPaymentStatus.paid_in_full,
        bookingStatus: RetreatBookingStatus.paid_in_full,
        balancePaidPence: booking.balanceAmountPence,
        balancePaidAt: new Date(),
        stripeBalancePaymentIntentId: paymentIntentId || booking.stripeBalancePaymentIntentId,
      },
    });
    if (claimed.count === 0) return true;
    await sendRetreatPaymentReceipt(booking.id, amountPaidPence).catch((error) => {
      console.error("Failed to send retreat balance receipt", error);
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
      guestAcceptanceEvents: {
        select: { type: true, version: true },
      },
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

  const snapshot =
    booking.complianceSnapshotJson &&
    typeof booking.complianceSnapshotJson === "object" &&
    !Array.isArray(booking.complianceSnapshotJson)
      ? (booking.complianceSnapshotJson as Record<string, unknown>)
      : null;
  const snapshotStates = Array.isArray(snapshot?.acceptanceStates)
    ? (snapshot.acceptanceStates as Array<Record<string, unknown>>)
    : [];
  const evidenceTypes = new Set<string>([
    ...booking.guestAcceptanceEvents
      .filter((event) => Boolean(event.version))
      .map((event) => event.type),
    ...snapshotStates
      .filter(
        (state) =>
          typeof state.type === "string" &&
          typeof state.version === "string" &&
          state.version.length > 0
      )
      .map((state) => state.type as string),
  ]);
  if (booking.acceptedTermsVersion) evidenceTypes.add(AcceptanceType.terms);
  if (booking.acceptedHealthWaiverVersion) evidenceTypes.add(AcceptanceType.health_waiver);
  if (booking.acceptedHealthDataVersion) evidenceTypes.add(AcceptanceType.health_data);

  const requiredOriginalEvidence = [
    AcceptanceType.terms,
    AcceptanceType.health_waiver,
    AcceptanceType.health_data,
  ];
  if (requiredOriginalEvidence.some((type) => !evidenceTypes.has(type))) {
    throw new Error("ORIGINAL_ACCEPTANCE_EVIDENCE_MISSING");
  }
  await assertNoResourceDisputeHold("retreat_booking", booking.id);

  const nextInstalment =
    booking.instalments.find((instalment) => instalment.status === "pending") || null;
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
  const nextInstalment =
    booking.instalments.find((instalment) => instalment.status === "pending") || null;

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
    include: {
      retreatDate: true,
      roomOption: true,
      items: { where: { itemType: RetreatBookingItemType.addon }, include: { addon: true } },
      cancellationRequests: { orderBy: { requestedAt: "desc" }, take: 1 },
    },
    orderBy: { retreatDate: { startsAt: "asc" } },
  });

  return bookings.map((booking) => ({
    id: booking.id,
    retreatSlug: booking.retreatDate.retreatSlug,
    retreatTitle: booking.retreatDate.retreatTitleSnapshot,
    retreatType: booking.retreatDate.retreatType,
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
    attendeeCount: booking.attendeeCount,
    addons: booking.items.flatMap((item) =>
      item.addon
        ? [
            {
              id: item.addon.id,
              name: item.addon.name,
              quantity: item.quantity,
              totalPricePence: item.totalPricePence,
            },
          ]
        : []
    ),
    dietaryRequirements: booking.dietaryRequirements,
    medicalConditions: booking.medicalConditions,
    mobilityNeeds: booking.mobilityNeeds,
    liveRoomPrepared: booking.retreatDate.onlineRoomSetupStatus === "ready",
    canPayBalance: booking.paymentStatus !== "paid_in_full" && booking.balanceAmountPence > 0,
    canRequestCancellation:
      booking.purchaserUserId === userId &&
      ACTIVE_RETREAT_BOOKING_STATUSES.includes(booking.bookingStatus) &&
      booking.retreatDate.startsAt > new Date() &&
      !booking.cancellationRequests.some((request) =>
        OPEN_RETREAT_CANCELLATION_STATUSES.includes(request.status)
      ),
    latestCancellation: serializeCancellationRequest(booking.cancellationRequests[0] || null),
  }));
}

export async function getMyRetreatBookingDetail(userId: string, bookingId: string) {
  const booking = await db.retreatBooking.findFirst({
    where: {
      id: bookingId,
      OR: [{ purchaserUserId: userId }, { attendeeUserId: userId }],
    },
    include: {
      retreatDate: true,
      roomOption: true,
      attendees: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      items: { where: { itemType: RetreatBookingItemType.addon }, include: { addon: true } },
      cancellationRequests: { orderBy: { requestedAt: "desc" }, take: 1 },
    },
  });
  if (!booking) throw new Error("NOT_FOUND");

  return {
    id: booking.id,
    retreatSlug: booking.retreatDate.retreatSlug,
    retreatTitle: booking.retreatDate.retreatTitleSnapshot,
    retreatType: booking.retreatDate.retreatType,
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
    attendeeCount: booking.attendeeCount,
    addons: booking.items.flatMap((item) =>
      item.addon
        ? [
            {
              id: item.addon.id,
              name: item.addon.name,
              quantity: item.quantity,
              totalPricePence: item.totalPricePence,
            },
          ]
        : []
    ),
    dietaryRequirements: booking.dietaryRequirements,
    medicalConditions: booking.medicalConditions,
    mobilityNeeds: booking.mobilityNeeds,
    liveRoomPrepared: booking.retreatDate.onlineRoomSetupStatus === "ready",
    onlineAccess:
      booking.retreatDate.retreatType === "online"
        ? await getRetreatOnlineAccessState(booking.id, userId)
        : null,
    emergencyContactName: booking.emergencyContactName,
    emergencyContactPhone: booking.emergencyContactPhone,
    secondaryGuest:
      booking.attendeeCount > 1
        ? (() => {
            const attendee = booking.attendees.find((entry) => !entry.isPrimary);
            const email = attendee?.email || booking.guestTwoEmail;
            if (!email) return null;
            return {
              firstName: attendee?.firstName || booking.guestTwoFirstName || "",
              lastName: attendee?.lastName || booking.guestTwoLastName || "",
              email,
              dietaryRequirements: booking.guestTwoDietaryRequirements,
              status: attendee?.status || "pending_claim",
            };
          })()
        : null,
    canPayBalance: booking.paymentStatus !== "paid_in_full" && booking.balanceAmountPence > 0,
    canRequestCancellation:
      booking.purchaserUserId === userId &&
      ACTIVE_RETREAT_BOOKING_STATUSES.includes(booking.bookingStatus) &&
      booking.retreatDate.startsAt > new Date() &&
      !booking.cancellationRequests.some((request) =>
        OPEN_RETREAT_CANCELLATION_STATUSES.includes(request.status)
      ),
    latestCancellation: serializeCancellationRequest(booking.cancellationRequests[0] || null),
  };
}

export async function updateMyRetreatSecondaryGuest(input: {
  userId: string;
  bookingId: string;
  firstName: string;
  lastName: string;
  email: string;
  dietaryRequirements?: string;
}) {
  const firstName = normalizeText(input.firstName, 80);
  const lastName = normalizeText(input.lastName, 80);
  const email = normalizeEmail(input.email);
  const dietaryRequirements = normalizeText(input.dietaryRequirements || "", 1000) || null;
  if (!firstName || !lastName || !email || !email.includes("@")) {
    throw new Error("INVALID_SECONDARY_GUEST");
  }

  await db.$transaction(async (tx) => {
    await lockRetreatResource(tx, `retreat-booking:${input.bookingId}`);
    const booking = await tx.retreatBooking.findFirst({
      where: { id: input.bookingId, purchaserUserId: input.userId },
      include: { attendees: true, retreatDate: true },
    });
    if (!booking) throw new Error("NOT_FOUND");
    if (
      booking.attendeeCount < 2 ||
      !ACTIVE_RETREAT_BOOKING_STATUSES.includes(booking.bookingStatus) ||
      booking.retreatDate.startsAt <= new Date()
    ) {
      throw new Error("SECONDARY_GUEST_LOCKED");
    }

    const attendee = booking.attendees.find((entry) => !entry.isPrimary);
    if (attendee?.status === "claimed" && normalizeEmail(attendee.email) !== email) {
      throw new Error("SECONDARY_GUEST_ALREADY_CLAIMED");
    }

    await tx.retreatBooking.update({
      where: { id: booking.id },
      data: {
        guestTwoFirstName: firstName,
        guestTwoLastName: lastName,
        guestTwoEmail: email,
        guestTwoDietaryRequirements: dietaryRequirements,
      },
    });

    if (attendee) {
      await tx.retreatAttendee.update({
        where: { id: attendee.id },
        data: {
          firstName,
          lastName,
          displayName: `${firstName} ${lastName}`.trim(),
          email,
        },
      });
    } else {
      await tx.retreatAttendee.create({
        data: {
          bookingId: booking.id,
          firstName,
          lastName,
          displayName: `${firstName} ${lastName}`.trim(),
          email,
          isPrimary: false,
          isPurchaser: false,
          status: "pending_claim",
          claimToken: createBalanceToken(),
        },
      });
    }
  });

  return getMyRetreatBookingDetail(input.userId, input.bookingId);
}

function serializeCancellationRequest(
  request: {
    id: string;
    status: RetreatCancellationStatus;
    reason: string | null;
    refundableAmountPence: number;
    adminDecisionReason: string | null;
    requestedAt: Date;
    completedAt: Date | null;
  } | null
) {
  if (!request) return null;
  return {
    id: request.id,
    status: request.status,
    reason: request.reason,
    refundableAmountPence: request.refundableAmountPence,
    adminDecisionReason: request.adminDecisionReason,
    requestedAt: request.requestedAt.toISOString(),
    completedAt: request.completedAt?.toISOString() || null,
  };
}

async function sendRetreatCancellationCustomerEmail(input: {
  booking: {
    id: string;
    purchaserFirstName: string;
    purchaserEmail: string;
    currency: string;
    retreatDate: {
      retreatSlug: string;
      retreatTitleSnapshot: string;
      startsAt: Date;
      endsAt: Date;
    };
  };
  request: {
    status: RetreatCancellationStatus;
    reason: string | null;
    refundableAmountPence: number;
    adminDecisionReason: string | null;
  };
}) {
  const emailStatus =
    input.request.status === RetreatCancellationStatus.rejected
      ? "rejected"
      : input.request.status === RetreatCancellationStatus.completed
        ? "approved"
        : "requested";
  const dashboardUrl = buildAbsoluteUrl(`/dashboard/retreats/${input.booking.id}`);
  await sendPostmarkReactEmail({
    to: input.booking.purchaserEmail,
    subject:
      emailStatus === "requested"
        ? `${input.booking.retreatDate.retreatTitleSnapshot}: cancellation request received`
        : emailStatus === "approved"
          ? `${input.booking.retreatDate.retreatTitleSnapshot}: cancellation complete`
          : `${input.booking.retreatDate.retreatTitleSnapshot}: cancellation request update`,
    react: RetreatCancellationEmail({
      firstName: input.booking.purchaserFirstName,
      retreatName: input.booking.retreatDate.retreatTitleSnapshot,
      retreatDates: formatDateRange(
        input.booking.retreatDate.startsAt,
        input.booking.retreatDate.endsAt
      ),
      status: emailStatus,
      refundableAmount: formatCurrency(input.request.refundableAmountPence, input.booking.currency),
      dashboardUrl,
      reason: input.request.reason,
      decisionReason: input.request.adminDecisionReason,
    }),
    textBody: `${input.booking.retreatDate.retreatTitleSnapshot}: cancellation request ${emailStatus}. Refund under the booking terms: ${formatCurrency(input.request.refundableAmountPence, input.booking.currency)}. View your booking: ${dashboardUrl}`,
    tag: `retreat-cancellation-${emailStatus}`,
    templateKey: `retreat-cancellation-${emailStatus}`,
    metadata: {
      bookingId: input.booking.id,
      retreatSlug: input.booking.retreatDate.retreatSlug,
    },
    dispatchMode: "immediate_best_effort",
  });
}

export async function requestRetreatCancellation(input: {
  bookingId: string;
  userId: string;
  userEmail: string;
  reason?: string | null;
}) {
  const requestedAt = new Date();
  const reason = normalizeText(input.reason || "", 2000) || null;
  const result = await db.$transaction(async (tx) => {
    await lockRetreatResource(tx, `retreat-cancellation:${input.bookingId}`);
    const booking = await tx.retreatBooking.findFirst({
      where: {
        id: input.bookingId,
        purchaserUserId: input.userId,
      },
      include: {
        retreatDate: true,
        cancellationRequests: { orderBy: { requestedAt: "desc" }, take: 1 },
        refunds: { where: { status: RetreatRefundStatus.succeeded } },
      },
    });
    if (!booking) throw new Error("NOT_FOUND");
    if (!ACTIVE_RETREAT_BOOKING_STATUSES.includes(booking.bookingStatus)) {
      throw new Error("CANCELLATION_NOT_AVAILABLE");
    }
    if (booking.retreatDate.startsAt <= requestedAt) {
      throw new Error("RETREAT_ALREADY_STARTED");
    }

    const latestRequest = booking.cancellationRequests[0];
    if (latestRequest && OPEN_RETREAT_CANCELLATION_STATUSES.includes(latestRequest.status)) {
      return { booking, request: latestRequest, created: false };
    }

    const alreadyRefundedPence = booking.refunds.reduce(
      (sum, refund) => sum + refund.amountPence,
      0
    );
    const actualPaidPence = Math.max(
      booking.depositPaidPence + booking.balancePaidPence - alreadyRefundedPence,
      0
    );
    const refundableAmountPence = calculateRetreatRefund({
      actualPaidPence,
      nonRefundableAmountPence: Math.min(booking.nonRefundableAmountPence, actualPaidPence),
      startsAt: booking.retreatDate.startsAt,
      requestedAt,
      retreatType: booking.retreatDate.retreatType as RetreatType,
    });
    const policySnapshot = {
      ...(getRetreatRefundPolicySnapshot({
        retreatType: booking.retreatDate.retreatType as RetreatType,
        totalPence: booking.totalPricePence,
        depositPence: booking.depositAmountPence,
        startsAt: booking.retreatDate.startsAt,
      }) || {}),
      requestedAt: requestedAt.toISOString(),
      actualPaidPence,
      refundableAmountPence,
      currency: booking.currency,
    };
    const request = await tx.retreatCancellationRequest.create({
      data: {
        bookingId: booking.id,
        requestedByUserId: input.userId,
        requestedByEmail: normalizeEmail(input.userEmail) || booking.purchaserEmail,
        reason,
        refundableAmountPence,
        policySnapshotJson: policySnapshot,
      },
    });
    return { booking, request, created: true };
  });

  if (result.created) {
    await Promise.all([
      sendRetreatCancellationCustomerEmail({ booking: result.booking, request: result.request }),
      sendRetreatOperationalEmail({
        subject: `Cancellation request: ${result.booking.retreatDate.retreatTitleSnapshot}`,
        react: RetreatCancellationAdminEmail({
          customerName:
            `${result.booking.purchaserFirstName} ${result.booking.purchaserLastName}`.trim(),
          customerEmail: result.booking.purchaserEmail,
          retreatName: result.booking.retreatDate.retreatTitleSnapshot,
          retreatDates: formatDateRange(
            result.booking.retreatDate.startsAt,
            result.booking.retreatDate.endsAt
          ),
          refundableAmount: formatCurrency(
            result.request.refundableAmountPence,
            result.booking.currency
          ),
          reason: result.request.reason,
          adminUrl: buildAbsoluteUrl(`/admin/retreats/${result.booking.retreatDateId}`),
        }),
        textBody: `${result.booking.purchaserEmail} requested cancellation of ${result.booking.retreatDate.retreatTitleSnapshot}. Calculated refund: ${formatCurrency(result.request.refundableAmountPence, result.booking.currency)}. Review: ${buildAbsoluteUrl(`/admin/retreats/${result.booking.retreatDateId}`)}`,
        tag: "retreat-cancellation-admin",
        templateKey: "retreat-cancellation-admin",
        metadata: { bookingId: result.booking.id, requestId: result.request.id },
        dispatchMode: "immediate_best_effort",
      }),
    ]).catch((error) => {
      console.error("Failed to send retreat cancellation request email", error);
    });
  }

  return serializeCancellationRequest(result.request);
}

export async function rejectRetreatCancellation(input: {
  requestId: string;
  actorUserId: string;
  reason: string;
}) {
  const reason = normalizeText(input.reason, 2000);
  if (!reason) throw new Error("DECISION_REASON_REQUIRED");
  const result = await db.$transaction(async (tx) => {
    await lockRetreatResource(tx, `retreat-cancellation-request:${input.requestId}`);
    const request = await tx.retreatCancellationRequest.findUnique({
      where: { id: input.requestId },
      include: { booking: { include: { retreatDate: true } } },
    });
    if (!request) throw new Error("NOT_FOUND");
    if (request.status === RetreatCancellationStatus.rejected) return request;
    if (request.status !== RetreatCancellationStatus.requested) {
      throw new Error("CANCELLATION_ALREADY_DECIDED");
    }
    return tx.retreatCancellationRequest.update({
      where: { id: request.id },
      data: {
        status: RetreatCancellationStatus.rejected,
        adminDecisionReason: reason,
        reviewedByUserId: input.actorUserId,
        reviewedAt: new Date(),
      },
      include: { booking: { include: { retreatDate: true } } },
    });
  });
  await Promise.all([
    sendRetreatCancellationCustomerEmail({ booking: result.booking, request: result }),
    createAdminActionLog({
      actorUserId: input.actorUserId,
      actionType: "retreat_cancellation_rejected",
      targetType: "retreat_booking",
      targetId: result.bookingId,
      reason,
      metadataJson: { cancellationRequestId: result.id },
    }),
  ]);
  return result;
}

export async function approveRetreatCancellation(input: {
  requestId: string;
  actorUserId: string;
  reason?: string | null;
}) {
  const decisionReason = normalizeText(input.reason || "", 2000) || null;
  const claimed = await db.$transaction(async (tx) => {
    await lockRetreatResource(tx, `retreat-cancellation-request:${input.requestId}`);
    const request = await tx.retreatCancellationRequest.findUnique({
      where: { id: input.requestId },
      include: {
        booking: {
          include: {
            retreatDate: true,
            instalments: { orderBy: { sequence: "desc" } },
            refunds: { where: { status: RetreatRefundStatus.succeeded } },
          },
        },
        refunds: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!request) throw new Error("NOT_FOUND");
    if (request.status === RetreatCancellationStatus.completed) return { request, complete: true };
    if (!APPROVABLE_RETREAT_CANCELLATION_STATUSES.includes(request.status)) {
      throw new Error("CANCELLATION_ALREADY_DECIDED");
    }
    const refund = request.refunds[0]
      ? await tx.retreatRefund.update({
          where: { id: request.refunds[0].id },
          data: { status: RetreatRefundStatus.processing, failureReason: null },
        })
      : await tx.retreatRefund.create({
          data: {
            bookingId: request.bookingId,
            cancellationRequestId: request.id,
            amountPence: request.refundableAmountPence,
            currency: request.booking.currency,
            status: RetreatRefundStatus.processing,
            initiatedByUserId: input.actorUserId,
          },
        });
    const updatedRequest = await tx.retreatCancellationRequest.update({
      where: { id: request.id },
      data: {
        status: RetreatCancellationStatus.processing,
        adminDecisionReason: decisionReason,
        reviewedByUserId: input.actorUserId,
        reviewedAt: new Date(),
      },
    });
    return { request: { ...request, ...updatedRequest, refunds: [refund] }, complete: false };
  });

  if (claimed.complete) return claimed.request;
  const { request } = claimed;
  const booking = request.booking;
  const refundRecord = request.refunds[0];
  const alreadyRefundedPence = booking.refunds.reduce((sum, refund) => sum + refund.amountPence, 0);
  const actualPaidPence = Math.max(
    booking.depositPaidPence + booking.balancePaidPence - alreadyRefundedPence,
    0
  );
  const targetRefundPence = Math.min(request.refundableAmountPence, actualPaidPence);

  try {
    const paymentSources: Array<{ paymentIntentId: string; amountPence: number }> = [];
    const seenPaymentIntents = new Set<string>();
    for (const instalment of booking.instalments) {
      if (
        instalment.status === RetreatInstalmentStatus.paid &&
        instalment.stripePaymentIntentId &&
        !seenPaymentIntents.has(instalment.stripePaymentIntentId)
      ) {
        seenPaymentIntents.add(instalment.stripePaymentIntentId);
        paymentSources.push({
          paymentIntentId: instalment.stripePaymentIntentId,
          amountPence: instalment.amountPence,
        });
      }
    }
    const fallbackSources = [
      {
        paymentIntentId: booking.stripeBalancePaymentIntentId,
        amountPence: booking.balancePaidPence,
      },
      {
        paymentIntentId: booking.stripeDepositPaymentIntentId,
        amountPence: booking.depositPaidPence,
      },
    ];
    for (const source of fallbackSources) {
      if (
        source.paymentIntentId &&
        source.amountPence > 0 &&
        !seenPaymentIntents.has(source.paymentIntentId)
      ) {
        seenPaymentIntents.add(source.paymentIntentId);
        paymentSources.push({
          paymentIntentId: source.paymentIntentId,
          amountPence: source.amountPence,
        });
      }
    }
    if (targetRefundPence > 0 && paymentSources.length === 0) {
      throw new Error("RETREAT_PAYMENT_INTENT_MISSING");
    }

    let remainingPence = targetRefundPence;
    const stripeRefunds: Array<{ id: string; amountPence: number; status: string | null }> = [];
    const stripe = getStripeClient();
    for (const source of paymentSources) {
      if (remainingPence <= 0) break;
      const amountPence = Math.min(source.amountPence, remainingPence);
      const stripeRefund = await stripe.refunds.create(
        {
          payment_intent: source.paymentIntentId,
          amount: amountPence,
          reason: "requested_by_customer",
          metadata: {
            bookingId: booking.id,
            cancellationRequestId: request.id,
            retreatDateId: booking.retreatDateId,
            retreatRefundId: refundRecord.id,
          },
        },
        { idempotencyKey: `retreat-cancellation-${request.id}-${source.paymentIntentId}` }
      );
      stripeRefunds.push({
        id: stripeRefund.id,
        amountPence,
        status: stripeRefund.status || null,
      });
      remainingPence -= amountPence;
    }
    if (remainingPence > 0) throw new Error("RETREAT_REFUND_SOURCE_INSUFFICIENT");

    const completedAt = new Date();
    const refundCompleted =
      stripeRefunds.length === 0 || stripeRefunds.every((refund) => refund.status === "succeeded");
    const fullRefund = targetRefundPence > 0 && targetRefundPence >= actualPaidPence;
    const completed = await db.$transaction(async (tx) => {
      await lockRetreatResource(tx, `retreat-cancellation-request:${request.id}`);
      await tx.retreatRefund.update({
        where: { id: refundRecord.id },
        data: {
          status: refundCompleted ? RetreatRefundStatus.succeeded : RetreatRefundStatus.processing,
          stripeRefundIdsJson: stripeRefunds,
          completedAt: refundCompleted ? completedAt : null,
        },
      });
      await tx.retreatBookingInstalment.updateMany({
        where: { bookingId: booking.id, status: RetreatInstalmentStatus.pending },
        data: { status: RetreatInstalmentStatus.cancelled },
      });
      await tx.retreatOnlineAccessEntitlement.updateMany({
        where: { bookingId: booking.id },
        data: { liveAccessEnabled: false, replayAccessEnabled: false },
      });
      await tx.retreatBooking.update({
        where: { id: booking.id },
        data: {
          bookingStatus: fullRefund
            ? RetreatBookingStatus.refunded
            : RetreatBookingStatus.cancelled,
          paymentStatus: fullRefund
            ? RetreatPaymentStatus.refunded
            : targetRefundPence > 0
              ? RetreatPaymentStatus.partially_refunded
              : booking.paymentStatus,
          cancelledAt: completedAt,
        },
      });
      return tx.retreatCancellationRequest.update({
        where: { id: request.id },
        data: {
          status: refundCompleted
            ? RetreatCancellationStatus.completed
            : RetreatCancellationStatus.processing,
          completedAt: refundCompleted ? completedAt : null,
        },
        include: { booking: { include: { retreatDate: true } } },
      });
    });
    await releaseRoomUnitForBooking(booking.id);
    await Promise.all([
      ...(refundCompleted
        ? [sendRetreatCancellationCustomerEmail({ booking: completed.booking, request: completed })]
        : []),
      createAdminActionLog({
        actorUserId: input.actorUserId,
        actionType: "retreat_cancellation_approved",
        targetType: "retreat_booking",
        targetId: booking.id,
        reason: decisionReason,
        metadataJson: {
          cancellationRequestId: request.id,
          refundId: refundRecord.id,
          refundedAmountPence: targetRefundPence,
          stripeRefundIds: stripeRefunds.map((refund) => refund.id),
        },
      }),
    ]);
    return completed;
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : "RETREAT_REFUND_FAILED";
    await db.$transaction([
      db.retreatRefund.update({
        where: { id: refundRecord.id },
        data: { status: RetreatRefundStatus.failed, failureReason },
      }),
      db.retreatCancellationRequest.update({
        where: { id: request.id },
        data: { status: RetreatCancellationStatus.failed },
      }),
    ]);
    throw error;
  }
}

type StoredStripeRefund = {
  id: string;
  amountPence: number;
  status: string | null;
};

function parseStoredStripeRefunds(value: Prisma.JsonValue | null): StoredStripeRefund[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const id = "id" in item && typeof item.id === "string" ? item.id : "";
    const amountPence =
      "amountPence" in item && typeof item.amountPence === "number" ? item.amountPence : 0;
    const status = "status" in item && typeof item.status === "string" ? item.status : null;
    return id ? [{ id, amountPence, status }] : [];
  });
}

export async function processRetreatRefundUpdated(refund: Stripe.Refund) {
  const retreatRefundId = refund.metadata?.retreatRefundId || null;
  let record = retreatRefundId
    ? await db.retreatRefund.findUnique({
        where: { id: retreatRefundId },
        include: {
          cancellationRequest: true,
          booking: { include: { retreatDate: true } },
        },
      })
    : null;

  if (!record) {
    const candidates = await db.retreatRefund.findMany({
      where: { status: RetreatRefundStatus.processing },
      include: {
        cancellationRequest: true,
        booking: { include: { retreatDate: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    record =
      candidates.find((candidate) =>
        parseStoredStripeRefunds(candidate.stripeRefundIdsJson).some(
          (storedRefund) => storedRefund.id === refund.id
        )
      ) || null;
  }
  if (!record) return false;

  const storedRefunds = parseStoredStripeRefunds(record.stripeRefundIdsJson).map((storedRefund) =>
    storedRefund.id === refund.id
      ? { ...storedRefund, status: refund.status || null }
      : storedRefund
  );
  const failed = storedRefunds.some((item) =>
    ["failed", "canceled", "requires_action"].includes(item.status || "")
  );
  const succeeded =
    storedRefunds.length > 0 && storedRefunds.every((item) => item.status === "succeeded");
  const completedAt = succeeded ? new Date() : null;

  const updated = await db.$transaction(async (tx) => {
    await lockRetreatResource(tx, `retreat-refund:${record.id}`);
    await tx.retreatRefund.update({
      where: { id: record.id },
      data: {
        stripeRefundIdsJson: storedRefunds,
        status: failed
          ? RetreatRefundStatus.failed
          : succeeded
            ? RetreatRefundStatus.succeeded
            : RetreatRefundStatus.processing,
        failureReason: failed ? refund.failure_reason || `Stripe refund ${refund.status}` : null,
        completedAt,
      },
    });
    if (!record.cancellationRequestId) return null;
    return tx.retreatCancellationRequest.update({
      where: { id: record.cancellationRequestId },
      data: {
        status: failed
          ? RetreatCancellationStatus.failed
          : succeeded
            ? RetreatCancellationStatus.completed
            : RetreatCancellationStatus.processing,
        completedAt,
      },
      include: { booking: { include: { retreatDate: true } } },
    });
  });

  if (succeeded && updated) {
    await sendRetreatCancellationCustomerEmail({ booking: updated.booking, request: updated });
  }
  return true;
}

async function getRetreatOnlineAccessState(bookingId: string, userId: string) {
  const [entitlement, replayAsset] = await Promise.all([
    db.retreatOnlineAccessEntitlement.findFirst({
      where: { bookingId, userId },
      orderBy: { createdAt: "asc" },
    }),
    db.replayAsset.findFirst({
      where: {
        retreatDate: { bookings: { some: { id: bookingId } } },
        resourceType: "retreat_date",
        status: "ready",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
  ]);
  if (!entitlement) {
    return {
      entitled: false,
      liveAccessEnabled: false,
      liveAccessStartsAt: null,
      liveAccessEndsAt: null,
      replayAccessEnabled: false,
      replayAvailableAt: null,
      replayExpiresAt: null,
      replayAssetId: null,
    };
  }
  return {
    entitled: true,
    liveAccessEnabled: entitlement.liveAccessEnabled,
    liveAccessStartsAt: entitlement.liveAccessStartsAt?.toISOString() || null,
    liveAccessEndsAt: entitlement.liveAccessEndsAt?.toISOString() || null,
    replayAccessEnabled: entitlement.replayAccessEnabled,
    replayAvailableAt: entitlement.replayAvailableAt?.toISOString() || null,
    replayExpiresAt: entitlement.replayExpiresAt?.toISOString() || null,
    replayAssetId: entitlement.replayAccessEnabled ? replayAsset?.id || null : null,
  };
}

export async function getRetreatLiveRoomAccess(bookingId: string, userId: string) {
  const booking = await db.retreatBooking.findFirst({
    where: {
      id: bookingId,
      OR: [{ purchaserUserId: userId }, { attendeeUserId: userId }],
    },
    include: { retreatDate: true },
  });
  if (!booking) throw new Error("NOT_FOUND");
  if (booking.retreatDate.retreatType !== "online") throw new Error("NOT_ONLINE_RETREAT");
  if (!["deposit_paid", "partially_paid", "paid_in_full"].includes(booking.paymentStatus)) {
    throw new Error("PAYMENT_REQUIRED");
  }

  await ensureRetreatOnlineAccessEntitlement(booking.id);
  const entitlement = await db.retreatOnlineAccessEntitlement.findFirst({
    where: { bookingId: booking.id, userId, liveAccessEnabled: true },
    orderBy: { createdAt: "asc" },
  });
  if (!entitlement) throw new Error("FORBIDDEN");

  const now = new Date();
  if (entitlement.liveAccessStartsAt && now < entitlement.liveAccessStartsAt) {
    throw new Error("EARLY_JOIN_WINDOW");
  }
  if (entitlement.liveAccessEndsAt && now > entitlement.liveAccessEndsAt) {
    throw new Error("ROOM_CLOSED");
  }

  const retreatDate = booking.retreatDate;
  if (!retreatDate.dailyRoomName || !retreatDate.dailyRoomUrl) {
    throw new Error("ROOM_NOT_READY");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, name: true, email: true },
  });
  return {
    roomName: retreatDate.dailyRoomName,
    roomUrl: retreatDate.dailyRoomUrl,
    userName:
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.name ||
      user?.email ||
      booking.attendeeEmail,
    expiresAt: entitlement.liveAccessEndsAt || retreatDate.endsAt,
    chatEnabled: retreatDate.chatEnabled,
    defaultMicMuted: retreatDate.participantMicDefaultMuted,
    defaultCameraOff: retreatDate.participantCameraDefaultOff,
    isRecorded: retreatDate.isRecorded,
  };
}

export async function getAdminRetreatSummaries() {
  const retreatDates = await db.retreatDate.findMany({
    orderBy: { startsAt: "asc" },
    include: {
      bookings: true,
      roomOptions: { include: { ratePlans: { where: { active: true } } } },
    },
  });

  return retreatDates.map((date) => {
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

    const ratePlans = date.roomOptions.flatMap((roomOption) => roomOption.ratePlans);
    const normalPrices = ratePlans.map((ratePlan) => ratePlan.totalPricePence);
    const activeEarlyBirdPrices = ratePlans
      .filter(
        (ratePlan) =>
          ratePlan.earlyBirdEndsAt &&
          ratePlan.earlyBirdEndsAt.getTime() > Date.now() &&
          typeof ratePlan.earlyBirdPricePence === "number" &&
          ratePlan.earlyBirdPricePence < ratePlan.totalPricePence
      )
      .map((ratePlan) => ratePlan.earlyBirdPricePence)
      .filter((price): price is number => typeof price === "number");

    return {
      id: date.id,
      retreatSlug: date.retreatSlug,
      title: date.retreatTitleSnapshot,
      location: date.retreatLocationSnapshot,
      timezone: date.timezone,
      startDate: date.startsAt.toISOString(),
      endDate: date.endsAt.toISOString(),
      status: date.status,
      retreatType: date.retreatType,
      bookedSpaces,
      totalSpaces: date.capacity,
      revenuePence,
      earlyBirdPricePence:
        activeEarlyBirdPrices.length > 0
          ? Math.min(...activeEarlyBirdPrices)
          : normalPrices.length > 0
            ? Math.min(...normalPrices)
            : date.pricePence,
      normalPricePence: normalPrices.length > 0 ? Math.min(...normalPrices) : date.pricePence,
    };
  });
}

export async function getAdminRetreatTemplates() {
  const [templates, venues, latestDates] = await Promise.all([
    getRetreatTemplates(),
    getRetreatVenues(),
    db.retreatDate.findMany({
      orderBy: { startsAt: "desc" },
      include: {
        roomOptions: { include: { ratePlans: { where: { active: true } } } },
        depositRules: { where: { active: true }, orderBy: { createdAt: "desc" } },
      },
    }),
  ]);
  const latestDateBySlug = new Map<string, (typeof latestDates)[number]>();
  for (const date of latestDates) {
    if (!latestDateBySlug.has(date.retreatSlug)) latestDateBySlug.set(date.retreatSlug, date);
  }

  return templates.map((template) => {
    const sourceDate = latestDateBySlug.get(template.slug);
    const venue = getTemplateVenue(template, venues);
    const retreatType =
      template.deliveryMode === "online_live" ||
      template.deliveryMode === "online_on_demand" ||
      template.experienceType === "online_workshop"
        ? ("online" as const)
        : ("in_person" as const);
    const rates = sourceDate?.roomOptions.flatMap((option) => option.ratePlans) || [];
    const prices = rates.map((rate) => rate.totalPricePence);
    const depositRule = sourceDate?.depositRules[0];

    return {
      slug: template.slug,
      title: template.title,
      location:
        venue?.displayLocation ||
        venue?.name ||
        sourceDate?.retreatLocationSnapshot ||
        (retreatType === "online" ? "Online (live through this website)" : "To be confirmed"),
      retreatType,
      capacity: sourceDate?.capacity || (retreatType === "online" ? 30 : 10),
      pricePence: prices.length > 0 ? Math.min(...prices) : sourceDate?.pricePence || 0,
      paymentPolicy:
        retreatType === "online" || depositRule?.depositType === RetreatDepositType.full_payment
          ? ("full_payment" as const)
          : ("deposit" as const),
    };
  });
}

export type CreateAdminRetreatDateInput = {
  retreatSlug: string;
  title: string;
  location: string;
  retreatType: "in_person" | "online";
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  pricePence: number;
  paymentPolicy: "deposit" | "full_payment";
  earlyBirdPricePence?: number | null;
  earlyBirdEndsAt?: Date | null;
};

function buildRetreatDateExternalId(input: CreateAdminRetreatDateInput) {
  const datePart = input.startsAt.toISOString().slice(0, 10);
  const slugPart = input.retreatSlug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${slugPart}-${datePart}-${Date.now()}`;
}

export async function createAdminRetreatDate(input: CreateAdminRetreatDateInput) {
  if (input.endsAt <= input.startsAt) {
    throw new Error("INVALID_DATE_RANGE");
  }
  if (input.capacity < 1 || input.capacity > 200) {
    throw new Error("INVALID_CAPACITY");
  }
  if (input.pricePence < 0) {
    throw new Error("INVALID_PRICE");
  }
  if (input.earlyBirdPricePence !== undefined && input.earlyBirdPricePence !== null) {
    if (input.earlyBirdPricePence < 0 || input.earlyBirdPricePence >= input.pricePence) {
      throw new Error("INVALID_EARLY_BIRD");
    }
    if (!input.earlyBirdEndsAt || input.earlyBirdEndsAt <= new Date()) {
      throw new Error("INVALID_EARLY_BIRD");
    }
  }
  if (input.earlyBirdEndsAt && input.earlyBirdEndsAt >= input.startsAt) {
    throw new Error("INVALID_EARLY_BIRD");
  }

  const sourceDate = await db.retreatDate.findFirst({
    where: { retreatSlug: input.retreatSlug },
    orderBy: { startsAt: "desc" },
    include: {
      inventoryPools: true,
      roomOptions: {
        orderBy: { displayOrder: "asc" },
        include: {
          inventoryPool: true,
          ratePlans: { orderBy: { guestCount: "asc" } },
          roomUnits: { orderBy: { label: "asc" } },
        },
      },
      depositRules: { where: { active: true }, orderBy: { createdAt: "desc" } },
      addons: { where: { active: true }, orderBy: { createdAt: "asc" } },
      instructorAssignments: true,
    },
  });
  if (sourceDate && parseRetreatType(sourceDate.retreatType) !== input.retreatType) {
    throw new Error("RETREAT_TYPE_MISMATCH");
  }

  const externalDateId = buildRetreatDateExternalId(input);
  const isOnline = input.retreatType === "online";
  const sourceDepositRule = sourceDate?.depositRules[0] || null;
  const requiresFullPayment =
    isOnline ||
    input.paymentPolicy === "full_payment" ||
    sourceDepositRule?.depositType === RetreatDepositType.full_payment;
  const sourcePrices =
    sourceDate?.roomOptions.flatMap((option) =>
      option.ratePlans.filter((rate) => rate.active).map((rate) => rate.totalPricePence)
    ) || [];
  const standardPricePence = sourcePrices.length > 0 ? Math.min(...sourcePrices) : input.pricePence;
  const depositPercentageBasisPoints =
    !requiresFullPayment && sourceDepositRule?.depositType === RetreatDepositType.percentage
      ? sourceDepositRule.depositPercentageBasisPoints
      : !requiresFullPayment
        ? 2000
        : null;
  const fixedDepositAmountPence =
    !requiresFullPayment && sourceDepositRule?.depositType === RetreatDepositType.fixed_amount
      ? sourceDepositRule.fixedDepositAmountPence
      : null;
  const depositAmountPence = requiresFullPayment
    ? standardPricePence
    : fixedDepositAmountPence !== null
      ? Math.min(fixedDepositAmountPence, standardPricePence)
      : Math.round((standardPricePence * (depositPercentageBasisPoints || 2000)) / 10000);
  const balanceDueDaysBeforeStart = requiresFullPayment
    ? null
    : (sourceDepositRule?.balanceDueDaysBeforeStart ?? 56);
  const balanceDueAt =
    requiresFullPayment || balanceDueDaysBeforeStart === null
      ? null
      : new Date(input.startsAt.getTime() - balanceDueDaysBeforeStart * 86400000);
  const targetCapacity = sourceDate && !isOnline ? sourceDate.capacity : input.capacity;

  return db.$transaction(async (tx) => {
    const retreatDate = await tx.retreatDate.create({
      data: {
        externalDateId,
        retreatSlug: input.retreatSlug,
        retreatTitleSnapshot: input.title,
        retreatLocationSnapshot: input.location,
        retreatType: input.retreatType,
        timezone: "Europe/London",
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        capacity: targetCapacity,
        status: RetreatDateStatus.draft,
        currency: sourceDate?.currency || "GBP",
        pricePence: standardPricePence,
        depositAmountPence,
        balanceDueAt,
        isRecorded: isOnline,
        replayAccessDurationDays: isOnline ? (sourceDate?.replayAccessDurationDays ?? 7) : null,
        chatEnabled: sourceDate?.chatEnabled ?? true,
        participantMicDefaultMuted: sourceDate?.participantMicDefaultMuted ?? false,
        participantCameraDefaultOff: sourceDate?.participantCameraDefaultOff ?? false,
        payInFullDiscountEnabled:
          !requiresFullPayment && (sourceDate?.payInFullDiscountEnabled ?? true),
        payInFullDiscountPercent: sourceDate?.payInFullDiscountPercent ?? 5,
        payInFullDiscountCapPence: sourceDate?.payInFullDiscountCapPence ?? 5000,
        refundRuleId: sourceDate?.refundRuleId || null,
        paymentPlanSnapshotJson: {
          depositType: requiresFullPayment ? "full_payment" : "percentage",
          depositPercentageBasisPoints,
          fixedDepositAmountPence,
          balanceDueDaysBeforeStart,
        },
      },
    });

    if (sourceDate) {
      const inventoryPoolIds = new Map<string, string>();
      for (const pool of sourceDate.inventoryPools) {
        const createdPool = await tx.retreatInventoryPool.create({
          data: {
            retreatDateId: retreatDate.id,
            inventoryType: pool.inventoryType,
            name: pool.name,
            totalQuantity:
              isOnline && pool.inventoryType === RetreatInventoryType.online_live_place
                ? input.capacity
                : pool.totalQuantity,
            active: pool.active,
          },
        });
        inventoryPoolIds.set(pool.id, createdPool.id);
      }

      const roomOptionIds = new Map<string, string>();
      for (const option of sourceDate.roomOptions) {
        const optionCapacity = isOnline ? input.capacity : option.capacity;
        const createdOption = await tx.retreatRoomOption.create({
          data: {
            retreatDateId: retreatDate.id,
            inventoryPoolId: option.inventoryPoolId
              ? inventoryPoolIds.get(option.inventoryPoolId) || null
              : null,
            externalRoomOptionId: option.externalRoomOptionId,
            label: option.label,
            description: option.description,
            roomType: option.roomType,
            bookingUnit: option.bookingUnit,
            inventoryUnitsPerBooking: option.inventoryUnitsPerBooking,
            guestsIncluded: option.guestsIncluded,
            guestCountPerUnit: option.guestCountPerUnit,
            physicalRoomCount: option.physicalRoomCount,
            bedsPerPhysicalRoom: option.bedsPerPhysicalRoom,
            allowedGuestCountsJson: option.allowedGuestCountsJson ?? undefined,
            capacity: optionCapacity,
            availableSpots: optionCapacity,
            pricePence: option.pricePence,
            pricePerPersonPence: option.pricePerPersonPence,
            roomCount: option.roomCount,
            depositAmountPence: requiresFullPayment ? option.pricePence : option.depositAmountPence,
            isWaitlistOnly: false,
            displayOrder: option.displayOrder,
            active: option.active,
          },
        });
        roomOptionIds.set(option.id, createdOption.id);

        for (const ratePlan of option.ratePlans) {
          const sourceEarlyBirdSaving =
            ratePlan.earlyBirdPricePence === null
              ? null
              : Math.max(ratePlan.totalPricePence - ratePlan.earlyBirdPricePence, 0);
          const earlyBirdPricePence = input.earlyBirdEndsAt
            ? option.ratePlans.length === 1 && sourceDate.roomOptions.length === 1
              ? (input.earlyBirdPricePence ?? null)
              : sourceEarlyBirdSaving && sourceEarlyBirdSaving > 0
                ? Math.max(ratePlan.totalPricePence - sourceEarlyBirdSaving, 0)
                : null
            : null;
          await tx.retreatRatePlan.create({
            data: {
              roomOptionId: createdOption.id,
              guestCount: ratePlan.guestCount,
              totalPricePence: ratePlan.totalPricePence,
              earlyBirdPricePence,
              earlyBirdEndsAt: earlyBirdPricePence === null ? null : input.earlyBirdEndsAt,
              currency: ratePlan.currency,
              active: ratePlan.active,
            },
          });
        }

        for (const unit of option.roomUnits) {
          await tx.retreatRoomUnit.create({
            data: {
              retreatDateId: retreatDate.id,
              roomOptionId: createdOption.id,
              inventoryPoolId: option.inventoryPoolId
                ? inventoryPoolIds.get(option.inventoryPoolId) || null
                : null,
              label: unit.label,
              capacityUnits: unit.capacityUnits,
              status: "available",
              notes: unit.notes,
            },
          });
        }
      }

      for (const addon of sourceDate.addons) {
        await tx.retreatAddon.create({
          data: {
            retreatDateId: retreatDate.id,
            inventoryPoolId: addon.inventoryPoolId
              ? inventoryPoolIds.get(addon.inventoryPoolId) || null
              : null,
            name: addon.name,
            description: addon.description,
            pricePence: addon.pricePence,
            currency: addon.currency,
            requiresTimeSlot: addon.requiresTimeSlot,
            active: addon.active,
          },
        });
      }

      for (const assignment of sourceDate.instructorAssignments) {
        await tx.retreatDateInstructorAssignment.create({
          data: { retreatDateId: retreatDate.id, userId: assignment.userId },
        });
      }

      await tx.retreatDepositRule.create({
        data: {
          retreatDateId: retreatDate.id,
          depositType: requiresFullPayment
            ? RetreatDepositType.full_payment
            : sourceDepositRule?.depositType || RetreatDepositType.percentage,
          depositPercentageBasisPoints,
          fixedDepositAmountPence,
          balanceDueAt,
          balanceDueDaysBeforeStart,
          active: true,
        },
      });
      return retreatDate;
    }

    const inventoryType = isOnline
      ? RetreatInventoryType.online_live_place
      : RetreatInventoryType.bed_space;
    const bookingUnit = isOnline
      ? RetreatBookingUnit.online_live_place
      : RetreatBookingUnit.bed_space;
    const optionLabel = isOnline ? "Live Workshop Ticket" : "General Place";
    const optionId = isOnline ? "live-workshop-ticket" : "general-place";

    const inventoryPool = await tx.retreatInventoryPool.create({
      data: {
        retreatDateId: retreatDate.id,
        inventoryType,
        name: optionLabel,
        totalQuantity: input.capacity,
        active: true,
      },
    });

    const roomOption = await tx.retreatRoomOption.create({
      data: {
        retreatDateId: retreatDate.id,
        inventoryPoolId: inventoryPool.id,
        externalRoomOptionId: optionId,
        label: optionLabel,
        description: isOnline
          ? "Live online workshop access with replay access when a replay is published."
          : "General retreat place. Configure accommodation before opening public bookings.",
        roomType: isOnline ? "virtual" : "shared_twin",
        bookingUnit,
        inventoryUnitsPerBooking: 1,
        guestsIncluded: 1,
        guestCountPerUnit: 1,
        capacity: input.capacity,
        availableSpots: input.capacity,
        pricePence: input.pricePence,
        depositAmountPence,
        displayOrder: 1,
        active: true,
      },
    });

    await tx.retreatRatePlan.create({
      data: {
        roomOptionId: roomOption.id,
        guestCount: 1,
        totalPricePence: input.pricePence,
        earlyBirdPricePence: input.earlyBirdPricePence ?? null,
        earlyBirdEndsAt: input.earlyBirdPricePence ? input.earlyBirdEndsAt : null,
        currency: "GBP",
        active: true,
      },
    });

    await tx.retreatDepositRule.create({
      data: {
        retreatDateId: retreatDate.id,
        depositType: requiresFullPayment
          ? RetreatDepositType.full_payment
          : RetreatDepositType.percentage,
        depositPercentageBasisPoints,
        fixedDepositAmountPence: null,
        balanceDueAt,
        balanceDueDaysBeforeStart,
        active: true,
      },
    });

    if (!isOnline) {
      await tx.retreatRoomUnit.create({
        data: {
          retreatDateId: retreatDate.id,
          roomOptionId: roomOption.id,
          inventoryPoolId: inventoryPool.id,
          label: "General capacity",
          capacityUnits: input.capacity,
        },
      });
    }

    return retreatDate;
  });
}

export type RetreatPublishValidation = {
  valid: boolean;
  errors: string[];
};

async function validateRetreatDateForPublishing(
  retreatDateId: string
): Promise<RetreatPublishValidation> {
  const retreatDate = await db.retreatDate.findUnique({
    where: { id: retreatDateId },
    include: {
      inventoryPools: { where: { active: true } },
      roomOptions: {
        where: { active: true },
        include: {
          ratePlans: { where: { active: true } },
          roomUnits: true,
        },
      },
      depositRules: { where: { active: true } },
    },
  });
  if (!retreatDate) throw new Error("NOT_FOUND");

  const errors: string[] = [];
  const now = new Date();
  if (retreatDate.startsAt <= now || retreatDate.endsAt <= retreatDate.startsAt) {
    errors.push("Dates must describe a future experience.");
  }
  if (retreatDate.bookingOpensAt && retreatDate.bookingOpensAt >= retreatDate.startsAt) {
    errors.push("Booking must open before the experience starts.");
  }
  if (retreatDate.bookingClosesAt && retreatDate.bookingClosesAt > retreatDate.startsAt) {
    errors.push("Booking must close no later than the experience start.");
  }
  if (retreatDate.capacity < 1) errors.push("Capacity must be at least one place.");

  const templates = await getRetreatTemplates();
  if (!templates.some((template) => template.slug === retreatDate.retreatSlug)) {
    errors.push("A published Contentful experience with this slug is required.");
  }
  if (retreatDate.inventoryPools.length === 0) {
    errors.push("At least one active inventory pool is required.");
  }
  if (retreatDate.roomOptions.length === 0) {
    errors.push(
      retreatDate.retreatType === "online"
        ? "At least one active ticket is required."
        : "At least one active accommodation option is required."
    );
  }
  if (retreatDate.depositRules.length !== 1) {
    errors.push("Exactly one active payment rule is required.");
  }

  for (const option of retreatDate.roomOptions) {
    if (option.capacity < 1) errors.push(`${option.label} must have available inventory.`);
    if (option.ratePlans.length === 0) {
      errors.push(`${option.label} needs at least one active price.`);
    }
    for (const rate of option.ratePlans) {
      if (rate.totalPricePence < 0) errors.push(`${option.label} has an invalid price.`);
      if (
        (rate.earlyBirdPricePence === null) !== (rate.earlyBirdEndsAt === null) ||
        (rate.earlyBirdPricePence !== null &&
          (rate.earlyBirdPricePence >= rate.totalPricePence ||
            rate.earlyBirdPricePence < 0 ||
            rate.earlyBirdEndsAt! >= retreatDate.startsAt))
      ) {
        errors.push(`${option.label} has an invalid early-bird offer.`);
      }
    }

    if (retreatDate.retreatType === "in_person") {
      const physicalCapacity = retreatDate.roomOptions
        .flatMap((candidate) => candidate.roomUnits)
        .filter((unit) =>
          option.inventoryPoolId
            ? unit.inventoryPoolId === option.inventoryPoolId
            : unit.roomOptionId === option.id
        )
        .reduce((sum, unit) => sum + unit.capacityUnits, 0);
      const requiredCapacity = option.capacity * Math.max(option.inventoryUnitsPerBooking, 1);
      if (physicalCapacity < requiredCapacity) {
        errors.push(
          `${option.label} can consume ${requiredCapacity} base units but only ${physicalCapacity} physical room spaces are configured.`
        );
      }
    }
  }

  const rule = retreatDate.depositRules[0];
  if (retreatDate.retreatType === "online" && rule?.depositType !== "full_payment") {
    errors.push("Online experiences must use full payment.");
  }

  return { valid: errors.length === 0, errors };
}

export async function publishAdminRetreatDate(retreatDateId: string) {
  const validation = await validateRetreatDateForPublishing(retreatDateId);
  if (!validation.valid) {
    const error = new Error("RETREAT_PUBLISH_VALIDATION_FAILED");
    Object.assign(error, { validationErrors: validation.errors });
    throw error;
  }

  const result = await db.retreatDate.updateMany({
    where: { id: retreatDateId, status: RetreatDateStatus.draft },
    data: { status: RetreatDateStatus.open },
  });
  if (result.count === 0) throw new Error("INVALID_STATUS_TRANSITION");
  return getAdminRetreatDetail(retreatDateId);
}

export async function updateAdminRetreatSalesStatus(
  retreatDateId: string,
  requestedStatus: "open" | "closed" | "completed"
) {
  const current = await db.retreatDate.findUnique({
    where: { id: retreatDateId },
    select: { status: true, endsAt: true },
  });
  if (!current) throw new Error("NOT_FOUND");

  if (requestedStatus === "open") {
    if (current.status === RetreatDateStatus.draft) {
      return publishAdminRetreatDate(retreatDateId);
    }
    if (current.status !== RetreatDateStatus.closed) throw new Error("INVALID_STATUS_TRANSITION");
  } else if (requestedStatus === "closed") {
    if (
      current.status !== RetreatDateStatus.open &&
      current.status !== RetreatDateStatus.sold_out
    ) {
      throw new Error("INVALID_STATUS_TRANSITION");
    }
  } else if (
    current.endsAt > new Date() ||
    !(
      [
        RetreatDateStatus.open,
        RetreatDateStatus.closed,
        RetreatDateStatus.sold_out,
      ] as RetreatDateStatus[]
    ).includes(current.status)
  ) {
    throw new Error("INVALID_STATUS_TRANSITION");
  }

  await db.retreatDate.update({
    where: { id: retreatDateId },
    data: { status: requestedStatus },
  });
  return getAdminRetreatDetail(retreatDateId);
}

export async function sendRetreatBalanceDueEmails(input: {
  retreatDateId: string;
  mode?: "due" | "chaser";
  actorUserId?: string | null;
}) {
  const retreatDate = await db.retreatDate.findUnique({
    where: { id: input.retreatDateId },
    include: {
      bookings: {
        where: {
          bookingStatus: { in: ["balance_due", "deposit_paid", "paid_in_full"] },
          paymentStatus: { in: ["deposit_paid", "partially_paid", "paid_in_full"] },
        },
        include: {
          instalments: { orderBy: { sequence: "asc" } },
        },
      },
    },
  });
  if (!retreatDate) throw new Error("NOT_FOUND");

  let sent = 0;
  let skippedPaidInFull = 0;
  let skippedNoPaymentDue = 0;
  let skippedNoPaymentLink = 0;
  for (const booking of retreatDate.bookings) {
    if (
      booking.paymentStatus === "paid_in_full" ||
      booking.bookingStatus === "paid_in_full" ||
      booking.balanceAmountPence <= 0
    ) {
      skippedPaidInFull += 1;
      continue;
    }

    const nextInstalment =
      booking.instalments.find((instalment) => instalment.status === "pending") || null;
    if (!nextInstalment && booking.balanceAmountPence <= 0) {
      skippedNoPaymentDue += 1;
      continue;
    }

    if (!booking.balancePaymentUrlToken) {
      skippedNoPaymentLink += 1;
      continue;
    }
    const paymentUrl = buildAbsoluteUrl(`/retreats/balance/${booking.balancePaymentUrlToken}`);
    await sendPostmarkReactEmail({
      to: booking.purchaserEmail,
      subject:
        input.mode === "chaser"
          ? `${retreatDate.retreatTitleSnapshot}: balance reminder`
          : `${retreatDate.retreatTitleSnapshot}: balance payment`,
      react: RetreatBalanceDueEmail({
        firstName: booking.purchaserFirstName,
        retreatName: retreatDate.retreatTitleSnapshot,
        retreatDates: formatDateRange(retreatDate.startsAt, retreatDate.endsAt),
        balanceAmount: formatCurrency(
          nextInstalment?.amountPence || booking.balanceAmountPence,
          booking.currency
        ),
        dueDate: nextInstalment?.dueAt
          ? formatDate(nextInstalment.dueAt)
          : booking.balanceDueAt
            ? formatDate(booking.balanceDueAt)
            : "Before arrival",
        paymentUrl,
      }),
      textBody: `${retreatDate.retreatTitleSnapshot} balance payment\nAmount due: ${formatCurrency(nextInstalment?.amountPence || booking.balanceAmountPence, booking.currency)}\nPay here: ${paymentUrl}`,
      tag: input.mode === "chaser" ? "retreat-balance-chaser" : "retreat-balance-due",
      templateKey: input.mode === "chaser" ? "retreat-balance-chaser" : "retreat-balance-due",
      metadata: {
        bookingId: booking.id,
        retreatSlug: retreatDate.retreatSlug,
      },
      dispatchMode: "immediate_best_effort",
    });
    if (nextInstalment) {
      await db.retreatBookingInstalment.update({
        where: { id: nextInstalment.id },
        data: {
          lastReminderSentAt: new Date(),
          lastReminderMode: input.mode === "chaser" ? "chaser" : "due",
          lastReminderSentByUserId: input.actorUserId || null,
        },
      });
    }
    sent += 1;
  }

  return {
    sent,
    skipped: skippedPaidInFull + skippedNoPaymentDue + skippedNoPaymentLink,
    skippedPaidInFull,
    skippedNoPaymentDue,
    skippedNoPaymentLink,
  };
}

export async function setUpRetreatOnlineRoom(retreatDateId: string) {
  const retreatDate = await db.retreatDate.findUnique({
    where: { id: retreatDateId },
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
      retreatDate.endsAt,
      { maxParticipants: retreatDate.capacity + 4 }
    );
    const updated = await db.retreatDate.update({
      where: { id: retreatDate.id },
      data: {
        dailyRoomName: room.roomName,
        dailyRoomUrl: room.roomUrl,
        onlineRoomSetupStatus: ClassRoomSetupStatus.ready,
        onlineRoomSetupError: null,
        liveRoomState:
          retreatDate.liveRoomState === RetreatLiveRoomState.unprepared
            ? RetreatLiveRoomState.prepared
            : retreatDate.liveRoomState,
      },
    });
    if (updated.isRecorded) {
      const existingReplay = await db.replayAsset.findFirst({
        where: { retreatDateId: updated.id, resourceType: "retreat_date" },
        orderBy: { createdAt: "asc" },
      });
      if (existingReplay) {
        await db.replayAsset.update({
          where: { id: existingReplay.id },
          data: { dailyRoomName: room.roomName },
        });
      } else {
        await db.replayAsset.create({
          data: {
            resourceType: "retreat_date",
            retreatDateId: updated.id,
            dailyRoomName: room.roomName,
            recordingConfigSnapshotJson: {
              replayAccessDurationDays: updated.replayAccessDurationDays,
            },
          },
        });
      }
    }
    return updated;
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

async function getAddonReservedQuantity(addonId: string) {
  const now = new Date();
  const result = await db.retreatBookingItem.aggregate({
    where: {
      addonId,
      itemType: RetreatBookingItemType.addon,
      booking: {
        OR: [
          { bookingStatus: { in: ACTIVE_RETREAT_BOOKING_STATUSES } },
          {
            bookingStatus: RetreatBookingStatus.pending,
            createdAt: { gt: new Date(now.getTime() - RETREAT_PAYMENT_WINDOW_MS) },
          },
        ],
      },
    },
    _sum: { quantity: true },
  });
  return result._sum.quantity || 0;
}

export async function getAdminRetreatDetail(retreatDateId: string) {
  const bookingRows = await db.retreatDate.findUnique({
    where: { id: retreatDateId },
    include: {
      inventoryPools: { orderBy: { createdAt: "asc" } },
      bookings: {
        orderBy: { createdAt: "asc" },
        include: {
          roomOption: true,
          roomUnit: true,
          instalments: {
            orderBy: { sequence: "asc" },
          },
          cancellationRequests: {
            orderBy: { requestedAt: "desc" },
          },
          items: {
            where: { itemType: RetreatBookingItemType.addon },
            include: { addon: true },
          },
        },
      },
      roomOptions: {
        orderBy: { displayOrder: "asc" },
        include: {
          ratePlans: { orderBy: { guestCount: "asc" } },
          roomUnits: {
            orderBy: { label: "asc" },
            include: {
              bookings: {
                where: { bookingStatus: { in: ACTIVE_RETREAT_BOOKING_STATUSES } },
                select: {
                  id: true,
                  roomOption: { select: { inventoryUnitsPerBooking: true } },
                  items: {
                    where: {
                      itemType: {
                        in: [
                          RetreatBookingItemType.accommodation,
                          RetreatBookingItemType.online_live_place,
                        ],
                      },
                    },
                    select: { quantity: true },
                  },
                },
              },
            },
          },
        },
      },
      depositRules: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
      },
      addons: {
        orderBy: { createdAt: "asc" },
        include: { inventoryPool: true },
      },
      giftPurchases: {
        where: { type: "retreat" },
        include: { retreatRoomOption: true },
        orderBy: { createdAt: "asc" },
      },
      replayAssets: {
        where: { resourceType: "retreat_date" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!bookingRows) throw new Error("NOT_FOUND");

  const revenuePence =
    bookingRows.bookings.reduce(
      (sum, booking) => sum + booking.depositPaidPence + booking.balancePaidPence,
      0
    ) +
    bookingRows.giftPurchases
      .filter((gift) => gift.status === GiftPurchaseStatus.purchased)
      .reduce((sum, gift) => sum + gift.totalPaidPence - gift.refundedAmountPence, 0);
  const activeDepositRule = bookingRows.depositRules[0];
  const addons = await Promise.all(
    bookingRows.addons.map(async (addon) => {
      const reserved = await getAddonReservedQuantity(addon.id);
      return {
        id: addon.id,
        name: addon.name,
        description: addon.description,
        pricePence: addon.pricePence,
        currency: addon.currency,
        totalQuantity: addon.inventoryPool?.totalQuantity ?? null,
        availableQuantity: addon.inventoryPool
          ? Math.max(addon.inventoryPool.totalQuantity - reserved, 0)
          : null,
        requiresTimeSlot: addon.requiresTimeSlot,
        active: addon.active,
      };
    })
  );

  return {
    id: bookingRows.id,
    retreatSlug: bookingRows.retreatSlug,
    title: bookingRows.retreatTitleSnapshot,
    location: bookingRows.retreatLocationSnapshot,
    timezone: bookingRows.timezone,
    startDate: bookingRows.startsAt.toISOString(),
    endDate: bookingRows.endsAt.toISOString(),
    status: bookingRows.status,
    retreatType: bookingRows.retreatType,
    liveRoomPrepared: bookingRows.onlineRoomSetupStatus === ClassRoomSetupStatus.ready,
    liveRoomState: bookingRows.liveRoomState,
    liveDisplayMode: bookingRows.liveDisplayMode,
    liveDisplayVersion: bookingRows.liveDisplayVersion,
    focusedPresenterUserId: bookingRows.focusedPresenterUserId,
    replayPublished: bookingRows.replayAvailable,
    replayAssets: bookingRows.replayAssets.map((asset) => ({
      id: asset.id,
      status: asset.status,
      completedAt: asset.completedAt?.toISOString() || null,
      deleteAfterAt: asset.deleteAfterAt?.toISOString() || null,
    })),
    roomSetupStatus: bookingRows.onlineRoomSetupStatus,
    roomSetupError: bookingRows.onlineRoomSetupError,
    capacity: bookingRows.capacity,
    revenuePence,
    depositAmountPence: bookingRows.depositAmountPence,
    pricePence: bookingRows.pricePence,
    singleRoomSupplementPence: bookingRows.singleRoomSupplementPence,
    balanceDueAt: bookingRows.balanceDueAt?.toISOString() || null,
    paymentPolicy:
      activeDepositRule?.depositType === RetreatDepositType.full_payment
        ? ("full_payment" as const)
        : ("deposit" as const),
    depositRule: activeDepositRule
      ? {
          depositType: activeDepositRule.depositType,
          depositPercentageBasisPoints: activeDepositRule.depositPercentageBasisPoints,
          fixedDepositAmountPence: activeDepositRule.fixedDepositAmountPence,
          balanceDueDaysBeforeStart: activeDepositRule.balanceDueDaysBeforeStart,
        }
      : null,
    pricingLocked: bookingRows.status !== RetreatDateStatus.draft,
    inventoryPools: bookingRows.inventoryPools.map((pool) => ({
      id: pool.id,
      name: pool.name,
      inventoryType: pool.inventoryType,
      totalQuantity: pool.totalQuantity,
      active: pool.active,
    })),
    roomOptions: bookingRows.roomOptions.map((roomOption) => ({
      id: roomOption.id,
      label: roomOption.label,
      inventoryPoolId: roomOption.inventoryPoolId,
      inventoryUnitsPerBooking: roomOption.inventoryUnitsPerBooking,
      capacity: roomOption.capacity,
      bookingUnit: roomOption.bookingUnit,
      active: roomOption.active,
    })),
    ratePlans: bookingRows.roomOptions.flatMap((roomOption) =>
      roomOption.ratePlans.map((ratePlan) => ({
        id: ratePlan.id,
        roomOptionId: roomOption.id,
        roomLabel: roomOption.label,
        guestCount: ratePlan.guestCount,
        totalPricePence: ratePlan.totalPricePence,
        earlyBirdPricePence: ratePlan.earlyBirdPricePence,
        earlyBirdEndsAt: ratePlan.earlyBirdEndsAt?.toISOString() || null,
        active: ratePlan.active,
      }))
    ),
    addons,
    roomUnits: bookingRows.roomOptions.flatMap((roomOption) =>
      roomOption.roomUnits.map((unit) => ({
        id: unit.id,
        roomOptionId: roomOption.id,
        inventoryPoolId: unit.inventoryPoolId,
        roomOptionLabel: roomOption.label,
        label: unit.label,
        capacityUnits: unit.capacityUnits,
        occupiedUnits: unit.bookings.reduce(
          (sum, booking) =>
            sum +
            Math.max(
              booking.items.reduce((itemSum, item) => itemSum + item.quantity, 0) ||
                booking.roomOption?.inventoryUnitsPerBooking ||
                1,
              1
            ),
          0
        ),
        status: unit.status,
      }))
    ),
    gifts: bookingRows.giftPurchases.map((gift) => ({
      id: gift.id,
      purchaserName: `${gift.purchaserFirstName} ${gift.purchaserLastName}`.trim(),
      purchaserEmail: gift.purchaserEmail,
      recipientName: `${gift.recipientFirstName} ${gift.recipientLastName}`.trim(),
      recipientEmail: gift.recipientEmail,
      roomLabel: gift.retreatRoomOption?.label || null,
      guestCount: gift.retreatGuestCount || 1,
      totalPaidPence: gift.totalPaidPence,
      refundedAmountPence: gift.refundedAmountPence,
      status: gift.status,
      purchasedAt: gift.purchasedAt?.toISOString() || null,
      redeemedAt: gift.redeemedAt?.toISOString() || null,
    })),
    bookings: bookingRows.bookings.map((booking) => ({
      id: booking.id,
      purchaserName: `${booking.purchaserFirstName} ${booking.purchaserLastName}`.trim(),
      purchaserEmail: booking.purchaserEmail,
      attendeeName: `${booking.attendeeFirstName} ${booking.attendeeLastName}`.trim(),
      attendeeEmail: booking.attendeeEmail,
      attendeeCount: booking.attendeeCount,
      roomType: booking.roomOptionLabelSnapshot || booking.roomType,
      roomOptionId: booking.roomOptionId,
      inventoryPoolId: booking.roomOption?.inventoryPoolId || null,
      roomUnitId: booking.roomUnitId,
      roomUnitLabel: booking.roomUnit?.label || null,
      addons: booking.items.flatMap((item) =>
        item.addon
          ? [
              {
                id: item.addon.id,
                name: item.addon.name,
                quantity: item.quantity,
                totalPricePence: item.totalPricePence,
              },
            ]
          : []
      ),
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
      cancellationRequests: booking.cancellationRequests.map((request) => ({
        id: request.id,
        status: request.status,
        reason: request.reason,
        refundableAmountPence: request.refundableAmountPence,
        adminDecisionReason: request.adminDecisionReason,
        requestedAt: request.requestedAt.toISOString(),
        reviewedAt: request.reviewedAt?.toISOString() || null,
        completedAt: request.completedAt?.toISOString() || null,
      })),
      bookedAt: booking.bookedAt.toISOString(),
    })),
  };
}

export type AdminRetreatEarlyBirdRateUpdate = {
  ratePlanId: string;
  earlyBirdPricePence: number | null;
  earlyBirdEndsAt: Date | null;
};

export type AdminRetreatConfigurationUpdate = {
  inventoryPools: Array<{ id: string; totalQuantity: number }>;
  roomOptions: Array<{
    id: string;
    inventoryPoolId: string;
    inventoryUnitsPerBooking: number;
    capacity: number;
  }>;
  payment: {
    depositType: "percentage" | "fixed_amount" | "full_payment";
    depositPercentageBasisPoints: number | null;
    fixedDepositAmountPence: number | null;
    balanceDueDaysBeforeStart: number | null;
  };
};

export async function updateAdminRetreatConfiguration(
  retreatDateId: string,
  input: AdminRetreatConfigurationUpdate
) {
  await db.$transaction(async (tx) => {
    await lockRetreatResource(tx, `retreat-configuration:${retreatDateId}`);
    const retreatDate = await tx.retreatDate.findUnique({
      where: { id: retreatDateId },
      include: {
        inventoryPools: true,
        roomOptions: true,
        depositRules: { where: { active: true } },
      },
    });
    if (!retreatDate) throw new Error("NOT_FOUND");
    if (retreatDate.status !== RetreatDateStatus.draft) {
      throw new Error("RETREAT_CONFIGURATION_LOCKED");
    }
    if (input.inventoryPools.length !== retreatDate.inventoryPools.length) {
      throw new Error("INVALID_RETREAT_INVENTORY");
    }
    if (input.roomOptions.length !== retreatDate.roomOptions.length) {
      throw new Error("INVALID_RETREAT_INVENTORY");
    }

    const poolIds = new Set(retreatDate.inventoryPools.map((pool) => pool.id));
    const optionIds = new Set(retreatDate.roomOptions.map((option) => option.id));
    if (
      new Set(input.inventoryPools.map((pool) => pool.id)).size !== input.inventoryPools.length ||
      new Set(input.roomOptions.map((option) => option.id)).size !== input.roomOptions.length ||
      input.inventoryPools.some(
        (pool) =>
          !poolIds.has(pool.id) || !Number.isInteger(pool.totalQuantity) || pool.totalQuantity < 1
      ) ||
      input.roomOptions.some(
        (option) =>
          !optionIds.has(option.id) ||
          !poolIds.has(option.inventoryPoolId) ||
          !Number.isInteger(option.inventoryUnitsPerBooking) ||
          option.inventoryUnitsPerBooking < 1 ||
          !Number.isInteger(option.capacity) ||
          option.capacity < 1
      )
    ) {
      throw new Error("INVALID_RETREAT_INVENTORY");
    }

    const poolQuantityById = new Map(
      input.inventoryPools.map((pool) => [pool.id, pool.totalQuantity])
    );
    if (
      input.roomOptions.some(
        (option) =>
          option.inventoryUnitsPerBooking > (poolQuantityById.get(option.inventoryPoolId) || 0)
      )
    ) {
      throw new Error("INVALID_RETREAT_INVENTORY");
    }

    for (const pool of input.inventoryPools) {
      await tx.retreatInventoryPool.update({
        where: { id: pool.id },
        data: { totalQuantity: pool.totalQuantity },
      });
    }
    for (const option of input.roomOptions) {
      await tx.retreatRoomOption.update({
        where: { id: option.id },
        data: {
          inventoryPoolId: option.inventoryPoolId,
          inventoryUnitsPerBooking: option.inventoryUnitsPerBooking,
          capacity: option.capacity,
          availableSpots: option.capacity,
          roomUnits: {
            updateMany: { where: {}, data: { inventoryPoolId: option.inventoryPoolId } },
          },
        },
      });
      await tx.retreatRoomUnit.updateMany({
        where: {
          roomOptionId: option.id,
          capacityUnits: { lt: option.inventoryUnitsPerBooking },
        },
        data: { capacityUnits: option.inventoryUnitsPerBooking },
      });
    }

    const payment = input.payment;
    const isFullPayment = payment.depositType === "full_payment";
    if (
      (retreatDate.retreatType === "online" && !isFullPayment) ||
      (payment.depositType === "percentage" &&
        (!Number.isInteger(payment.depositPercentageBasisPoints) ||
          (payment.depositPercentageBasisPoints || 0) < 1 ||
          (payment.depositPercentageBasisPoints || 0) > 10000)) ||
      (payment.depositType === "fixed_amount" &&
        (!Number.isInteger(payment.fixedDepositAmountPence) ||
          (payment.fixedDepositAmountPence || 0) < 0)) ||
      (!isFullPayment &&
        (!Number.isInteger(payment.balanceDueDaysBeforeStart) ||
          (payment.balanceDueDaysBeforeStart || 0) < 0))
    ) {
      throw new Error("INVALID_RETREAT_PAYMENT_RULE");
    }

    const balanceDueDaysBeforeStart = isFullPayment ? null : payment.balanceDueDaysBeforeStart;
    const balanceDueAt =
      balanceDueDaysBeforeStart === null
        ? null
        : new Date(retreatDate.startsAt.getTime() - balanceDueDaysBeforeStart * 86400000);
    const depositAmountPence =
      payment.depositType === "percentage"
        ? Math.round((retreatDate.pricePence * (payment.depositPercentageBasisPoints || 0)) / 10000)
        : payment.depositType === "fixed_amount"
          ? Math.min(payment.fixedDepositAmountPence || 0, retreatDate.pricePence)
          : retreatDate.pricePence;

    await tx.retreatDepositRule.updateMany({
      where: { retreatDateId, active: true },
      data: { active: false },
    });
    await tx.retreatDepositRule.create({
      data: {
        retreatDateId,
        depositType: payment.depositType,
        depositPercentageBasisPoints:
          payment.depositType === "percentage" ? payment.depositPercentageBasisPoints : null,
        fixedDepositAmountPence:
          payment.depositType === "fixed_amount" ? payment.fixedDepositAmountPence : null,
        balanceDueDaysBeforeStart,
        balanceDueAt,
        active: true,
      },
    });
    await tx.retreatDate.update({
      where: { id: retreatDateId },
      data: {
        depositAmountPence,
        balanceDueAt,
        paymentPlanSnapshotJson: {
          depositType: payment.depositType,
          depositPercentageBasisPoints:
            payment.depositType === "percentage" ? payment.depositPercentageBasisPoints : null,
          fixedDepositAmountPence:
            payment.depositType === "fixed_amount" ? payment.fixedDepositAmountPence : null,
          balanceDueDaysBeforeStart,
        },
      },
    });
  });

  return getAdminRetreatDetail(retreatDateId);
}

export async function assignAdminRetreatRoomUnit(input: {
  retreatDateId: string;
  bookingId: string;
  roomUnitId: string | null;
  actorUserId: string;
}) {
  const previousRoomUnitId = await db.$transaction(async (tx) => {
    await lockRetreatResource(tx, `retreat-booking-room:${input.bookingId}`);
    const booking = await tx.retreatBooking.findFirst({
      where: { id: input.bookingId, retreatDateId: input.retreatDateId },
      select: {
        id: true,
        roomOptionId: true,
        roomUnitId: true,
        bookingStatus: true,
        roomOption: { select: { inventoryPoolId: true, inventoryUnitsPerBooking: true } },
        items: {
          where: {
            itemType: {
              in: [RetreatBookingItemType.accommodation, RetreatBookingItemType.online_live_place],
            },
          },
          select: { inventoryPoolId: true, quantity: true },
        },
      },
    });
    if (!booking) throw new Error("NOT_FOUND");
    if (!ACTIVE_RETREAT_BOOKING_STATUSES.includes(booking.bookingStatus)) {
      throw new Error("BOOKING_NOT_ACTIVE");
    }

    if (input.roomUnitId) {
      if (!booking.roomOptionId) throw new Error("ROOM_ASSIGNMENT_INVALID");
      await lockRetreatResource(tx, `retreat-room-unit:${input.roomUnitId}`);
      const roomUnit = await tx.retreatRoomUnit.findFirst({
        where: {
          id: input.roomUnitId,
          retreatDateId: input.retreatDateId,
          OR: [
            { roomOptionId: booking.roomOptionId },
            ...(booking.roomOption?.inventoryPoolId
              ? [{ inventoryPoolId: booking.roomOption.inventoryPoolId }]
              : []),
          ],
          status: { not: "unavailable" },
        },
        include: {
          bookings: {
            where: {
              id: { not: booking.id },
              bookingStatus: { in: ACTIVE_RETREAT_BOOKING_STATUSES },
            },
            select: {
              id: true,
              roomOption: { select: { inventoryUnitsPerBooking: true } },
              items: {
                where: {
                  itemType: {
                    in: [
                      RetreatBookingItemType.accommodation,
                      RetreatBookingItemType.online_live_place,
                    ],
                  },
                },
                select: { quantity: true },
              },
            },
          },
        },
      });
      if (!roomUnit) throw new Error("ROOM_ASSIGNMENT_INVALID");
      const requestedUnits = Math.max(
        booking.items.reduce((sum, item) => sum + item.quantity, 0) ||
          booking.roomOption?.inventoryUnitsPerBooking ||
          1,
        1
      );
      const occupiedUnits = roomUnit.bookings.reduce(
        (sum, assignedBooking) =>
          sum +
          Math.max(
            assignedBooking.items.reduce((itemSum, item) => itemSum + item.quantity, 0) ||
              assignedBooking.roomOption?.inventoryUnitsPerBooking ||
              1,
            1
          ),
        0
      );
      if (occupiedUnits + requestedUnits > roomUnit.capacityUnits) {
        throw new Error("ROOM_UNIT_UNAVAILABLE");
      }
    }

    const previous = booking.roomUnitId;
    await tx.retreatBooking.update({
      where: { id: booking.id },
      data: { roomUnitId: input.roomUnitId },
    });

    const affectedRoomUnitIds = [previous, input.roomUnitId].filter((value): value is string =>
      Boolean(value)
    );
    for (const roomUnitId of new Set(affectedRoomUnitIds)) {
      const [unit, activeBookings] = await Promise.all([
        tx.retreatRoomUnit.findUnique({
          where: { id: roomUnitId },
          select: { capacityUnits: true, status: true },
        }),
        tx.retreatBooking.findMany({
          where: {
            roomUnitId,
            bookingStatus: { in: ACTIVE_RETREAT_BOOKING_STATUSES },
          },
          select: {
            roomOption: { select: { inventoryUnitsPerBooking: true } },
            items: {
              where: {
                itemType: {
                  in: [
                    RetreatBookingItemType.accommodation,
                    RetreatBookingItemType.online_live_place,
                  ],
                },
              },
              select: { quantity: true },
            },
          },
        }),
      ]);
      if (unit && unit.status !== "unavailable") {
        const occupiedUnits = activeBookings.reduce(
          (sum, activeBooking) =>
            sum +
            Math.max(
              activeBooking.items.reduce((itemSum, item) => itemSum + item.quantity, 0) ||
                activeBooking.roomOption?.inventoryUnitsPerBooking ||
                1,
              1
            ),
          0
        );
        await tx.retreatRoomUnit.update({
          where: { id: roomUnitId },
          data: { status: occupiedUnits >= unit.capacityUnits ? "assigned" : "available" },
        });
      }
    }
    return previous;
  });

  await createAdminActionLog({
    actorUserId: input.actorUserId,
    actionType: "retreat_room_assignment_updated",
    targetType: "retreat_booking",
    targetId: input.bookingId,
    metadataJson: { previousRoomUnitId, roomUnitId: input.roomUnitId },
  });
  return getAdminRetreatDetail(input.retreatDateId);
}

export async function updateAdminRetreatEarlyBirdRates(
  retreatDateId: string,
  updates: AdminRetreatEarlyBirdRateUpdate[]
) {
  if (updates.length === 0) throw new Error("EARLY_BIRD_RATES_REQUIRED");
  if (new Set(updates.map((update) => update.ratePlanId)).size !== updates.length) {
    throw new Error("INVALID_EARLY_BIRD");
  }

  await db.$transaction(async (tx) => {
    const retreatDate = await tx.retreatDate.findUnique({
      where: { id: retreatDateId },
      select: {
        id: true,
        startsAt: true,
        status: true,
        roomOptions: {
          select: {
            ratePlans: {
              select: {
                id: true,
                totalPricePence: true,
                earlyBirdPricePence: true,
                earlyBirdEndsAt: true,
              },
            },
          },
        },
      },
    });
    if (!retreatDate) throw new Error("NOT_FOUND");

    const ratePlanById = new Map(
      retreatDate.roomOptions
        .flatMap((roomOption) => roomOption.ratePlans)
        .map((plan) => [plan.id, plan])
    );

    for (const update of updates) {
      const ratePlan = ratePlanById.get(update.ratePlanId);
      if (!ratePlan) throw new Error("INVALID_EARLY_BIRD");

      if (
        retreatDate.status !== RetreatDateStatus.draft &&
        !canExtendPublishedEarlyBirdRate({
          existingPricePence: ratePlan.earlyBirdPricePence,
          existingEndsAt: ratePlan.earlyBirdEndsAt,
          submittedPricePence: update.earlyBirdPricePence,
          submittedEndsAt: update.earlyBirdEndsAt,
          retreatStartsAt: retreatDate.startsAt,
        })
      ) {
        throw new Error("RETREAT_PRICING_LOCKED");
      }

      if (retreatDate.status !== RetreatDateStatus.draft && ratePlan.earlyBirdPricePence === null) {
        continue;
      }

      const hasPrice = update.earlyBirdPricePence !== null;
      const hasEndDate = update.earlyBirdEndsAt !== null;
      if (hasPrice !== hasEndDate) throw new Error("INVALID_EARLY_BIRD");
      if (
        hasPrice &&
        (update.earlyBirdPricePence! < 0 ||
          update.earlyBirdPricePence! >= ratePlan.totalPricePence ||
          update.earlyBirdEndsAt! >= retreatDate.startsAt)
      ) {
        throw new Error("INVALID_EARLY_BIRD");
      }
    }

    await Promise.all(
      updates.map((update) =>
        tx.retreatRatePlan.update({
          where: { id: update.ratePlanId },
          data: {
            earlyBirdPricePence: update.earlyBirdPricePence,
            earlyBirdEndsAt: update.earlyBirdEndsAt,
          },
        })
      )
    );
  });

  return getAdminRetreatDetail(retreatDateId);
}

export type AdminRetreatAddonInput = {
  name: string;
  description?: string | null;
  pricePence: number;
  totalQuantity?: number | null;
};

function validateAdminRetreatAddonInput(input: AdminRetreatAddonInput) {
  const name = normalizeText(input.name, 120);
  const description = input.description ? normalizeText(input.description, 500) : null;
  const totalQuantity = input.totalQuantity ?? null;
  if (
    !name ||
    !Number.isInteger(input.pricePence) ||
    input.pricePence < 0 ||
    (totalQuantity !== null && (!Number.isInteger(totalQuantity) || totalQuantity < 1))
  ) {
    throw new Error("INVALID_RETREAT_ADDON");
  }
  return { name, description, pricePence: input.pricePence, totalQuantity };
}

export async function createAdminRetreatAddon(
  retreatDateId: string,
  input: AdminRetreatAddonInput
) {
  const validated = validateAdminRetreatAddonInput(input);
  await db.$transaction(async (tx) => {
    const retreatDate = await tx.retreatDate.findUnique({
      where: { id: retreatDateId },
      select: { id: true, status: true, currency: true },
    });
    if (!retreatDate) throw new Error("NOT_FOUND");
    if (retreatDate.status !== RetreatDateStatus.draft) {
      throw new Error("RETREAT_ADDONS_LOCKED");
    }

    const inventoryPool =
      validated.totalQuantity === null
        ? null
        : await tx.retreatInventoryPool.create({
            data: {
              retreatDateId,
              inventoryType: RetreatInventoryType.addon,
              name: validated.name,
              totalQuantity: validated.totalQuantity,
            },
          });
    await tx.retreatAddon.create({
      data: {
        retreatDateId,
        inventoryPoolId: inventoryPool?.id || null,
        name: validated.name,
        description: validated.description,
        pricePence: validated.pricePence,
        currency: retreatDate.currency,
      },
    });
  });
  return getAdminRetreatDetail(retreatDateId);
}

export async function removeAdminRetreatAddon(retreatDateId: string, addonId: string) {
  await db.$transaction(async (tx) => {
    const addon = await tx.retreatAddon.findFirst({
      where: { id: addonId, retreatDateId },
      include: { retreatDate: { select: { status: true } }, bookingItems: { take: 1 } },
    });
    if (!addon) throw new Error("NOT_FOUND");
    if (addon.retreatDate.status !== RetreatDateStatus.draft || addon.bookingItems.length > 0) {
      throw new Error("RETREAT_ADDONS_LOCKED");
    }
    await tx.retreatAddon.delete({ where: { id: addon.id } });
    if (addon.inventoryPoolId) {
      await tx.retreatInventoryPool.delete({ where: { id: addon.inventoryPoolId } });
    }
  });
  return getAdminRetreatDetail(retreatDateId);
}
