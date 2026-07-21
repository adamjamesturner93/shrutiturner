import {
  AcceptanceType,
  ClassRoomSetupStatus,
  GiftPurchaseStatus,
  Prisma,
  RetreatBookingStatus,
  RetreatBookingUnit,
  RetreatDepositType,
  RetreatInventoryType,
  RetreatInstalmentKind,
  RetreatInstalmentStatus,
  RetreatOnlineAccessType,
  RetreatPaymentStatus,
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
import { createSessionRoom, isDailyConfigured } from "@/lib/daily/service";
import {
  buildRetreatInstalmentPlan,
  calculatePayInFullDiscount,
  calculateRetreatNonRefundableAmount,
  getEffectiveRetreatRatePricePence,
  quoteRetreatAccommodation,
  type RetreatPaymentPlan,
  type RetreatType,
} from "@/lib/retreats/pricing";
import { getRetreatImageSrc } from "@/lib/retreats/images";

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

const RETREAT_LIVE_JOIN_LEAD_MS = 30 * 60 * 1000;
const RETREAT_LIVE_JOIN_GRACE_MS = 2 * 60 * 60 * 1000;

export async function ensureRetreatOnlineAccessEntitlement(bookingId: string) {
  const booking = await db.retreatBooking.findUnique({
    where: { id: bookingId },
    include: { retreatDate: true },
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

async function assignRoomUnitAfterPayment(bookingId: string) {
  const booking = await db.retreatBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      roomUnitId: true,
      retreatDateId: true,
      roomOptionId: true,
      retreatDate: { select: { retreatType: true } },
    },
  });
  if (!booking || booking.roomUnitId || !booking.roomOptionId) return;
  if (booking.retreatDate.retreatType === "online") return;

  const roomUnit = await db.retreatRoomUnit.findFirst({
    where: {
      retreatDateId: booking.retreatDateId,
      roomOptionId: booking.roomOptionId,
      status: "available",
    },
    orderBy: { label: "asc" },
  });
  if (!roomUnit) return;

  await db.$transaction([
    db.retreatRoomUnit.update({
      where: { id: roomUnit.id },
      data: { status: "assigned" },
    }),
    db.retreatBooking.update({
      where: { id: booking.id },
      data: { roomUnitId: roomUnit.id },
    }),
  ]);
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

async function assertRoomInventoryAvailableForUpdate(
  tx: Prisma.TransactionClient,
  roomOptionId: string,
  capacity: number
) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${roomOptionId}))`;
  const now = new Date();
  const [bookingCount, giftCount] = await Promise.all([
    tx.retreatBooking.count({
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
    tx.giftPurchase.count({
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
  if (bookingCount + giftCount >= capacity) {
    throw new Error("ROOM_OPTION_UNAVAILABLE");
  }
}

type OperationalRetreatDate = Prisma.RetreatDateGetPayload<{
  include: { roomOptions: { include: { ratePlans: true } }; bookings: true };
}>;

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

async function mapOperationalRoomOption(
  roomOption: OperationalRetreatDate["roomOptions"][number]
): Promise<RetreatRoomOptionContent> {
  const reserved = await getRoomAvailability(roomOption.id);
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
    guestsIncluded: roomOption.guestsIncluded,
    guestCountPerUnit: roomOption.guestCountPerUnit ?? undefined,
    allowedGuestCounts,
    capacity: roomOption.capacity,
    availableSpots: Math.max(roomOption.capacity - reserved, 0),
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
  const roomOptions = await Promise.all(date.roomOptions.map(mapOperationalRoomOption));
  const roomOptionCapacity = roomOptions.reduce((sum, roomOption) => sum + roomOption.capacity, 0);
  const roomOptionAvailability = roomOptions.reduce(
    (sum, roomOption) => sum + roomOption.availableSpots,
    0
  );
  const confirmedBookings = date.bookings.filter((booking) =>
    ["deposit_paid", "balance_due", "paid_in_full"].includes(booking.bookingStatus)
  );
  const bookedSpaces = confirmedBookings.reduce(
    (sum, booking) => sum + Math.max(booking.attendeeCount || booking.guestsIncluded || 1, 1),
    0
  );

  return {
    id: date.externalDateId,
    retreatType: parseRetreatType(date.retreatType),
    timezone: date.timezone,
    startDate: date.startsAt.toISOString(),
    endDate: date.endsAt.toISOString(),
    availableSpaces:
      roomOptions.length > 0 ? roomOptionAvailability : Math.max(date.capacity - bookedSpaces, 0),
    totalSpaces:
      roomOptions.length > 0 ? Math.max(roomOptionCapacity, date.capacity) : date.capacity,
    roomOptions,
    paymentPlan: undefined,
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
    venueId: venue?.id,
    venueSlug: venue?.slug,
    venueName: venue?.name,
    venue,
  };
}

async function getBookableOperationalDates(slug?: string): Promise<OperationalRetreatDate[]> {
  const now = new Date();
  return db.retreatDate.findMany({
    where: {
      ...(slug ? { retreatSlug: slug } : {}),
      status: { in: ["open", "sold_out"] },
      endsAt: { gte: now },
    },
    include: {
      roomOptions: {
        where: { active: true },
        include: { ratePlans: { where: { active: true }, orderBy: { guestCount: "asc" } } },
        orderBy: { displayOrder: "asc" },
      },
      bookings: true,
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
          },
          update: {},
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
    include: { roomOptions: { include: { ratePlans: true } } },
  });
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
      if (!template) {
        throw new Error(`CONTENTFUL_CONTENT_MISSING: retreatTemplate "${slug}" is not published`);
      }
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
  const selectedDepositPence =
    roomOption.depositAmountPence && roomOption.pricePence > 0
      ? Math.min(
          selectedTotalPricePence,
          Math.round(
            (selectedTotalPricePence * roomOption.depositAmountPence) / roomOption.pricePence
          )
        )
      : getDepositAmountPence(selectedTotalPricePence);
  const quote = quoteRetreatAccommodation({
    bookingUnit: roomOption.bookingUnit,
    quantity: 1,
    guestCount: selectedGuestCount,
    allowedGuestCounts,
    guestCountPerUnit: roomOption.guestCountPerUnit,
    ratePlans,
    depositRule: {
      depositType: "fixed_amount",
      fixedDepositAmountPence: selectedDepositPence,
    },
    currency: retreatDate.currency,
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

    const giftPayInFullDiscountPence = calculatePayInFullDiscount(
      quote.totalPricePence,
      retreatDate.payInFullDiscountEnabled,
      retreatDate.payInFullDiscountPercent,
      retreatDate.payInFullDiscountCapPence
    );
    const giftTotalPence = Math.max(quote.totalPricePence - giftPayInFullDiscountPence, 0);

    const gift = await db.$transaction(async (tx) => {
      await assertRoomInventoryAvailableForUpdate(tx, roomOption.id, roomOption.capacity);
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

  if (
    quote.totalGuestCount > 1 &&
    (!input.guestTwoFirstName?.trim() ||
      !input.guestTwoLastName?.trim() ||
      !input.guestTwoEmail?.trim())
  ) {
    throw new Error("SECOND_GUEST_REQUIRED");
  }

  const payInFullDiscountPence = calculatePayInFullDiscount(
    quote.totalPricePence,
    input.paymentOption === "pay_in_full" && retreatDate.payInFullDiscountEnabled,
    retreatDate.payInFullDiscountPercent,
    retreatDate.payInFullDiscountCapPence
  );
  const payableTotalPence = Math.max(0, quote.totalPricePence - payInFullDiscountPence);
  const depositAmountPence = Math.min(quote.depositPence, payableTotalPence);
  const retreatType = parseRetreatType(retreatDate.retreatType);
  const refundPolicySnapshot = getRetreatRefundPolicySnapshot({
    retreatType,
    totalPence: payableTotalPence,
    depositPence: depositAmountPence,
    startsAt: retreatDate.startsAt,
  });
  const nonRefundableAmountPence = refundPolicySnapshot.nonRefundableAmountPence;
  const paymentPlan = retreatDate.paymentPlanSnapshotJson as RetreatPaymentPlan | null;
  const instalmentDrafts = buildRetreatInstalmentPlan({
    totalPence: payableTotalPence,
    depositPence: depositAmountPence,
    startsAt: retreatDate.startsAt,
    paymentPlan,
    payInFull: input.paymentOption === "pay_in_full",
  });
  const initialInstalment = instalmentDrafts[0];
  if (!initialInstalment) {
    throw new Error("RETREAT_PAYMENT_PLAN_INVALID");
  }
  const balanceAmountPence = Math.max(
    0,
    instalmentDrafts.slice(1).reduce((sum, instalment) => sum + instalment.amountPence, 0)
  );

  const booking = await db.$transaction(async (tx) => {
    await assertRoomInventoryAvailableForUpdate(tx, roomOption.id, roomOption.capacity);
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
        depositAmountPence,
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
          create: {
            itemType: retreatDate.retreatType === "online" ? "online_live_place" : "accommodation",
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
            totalPricePence: payableTotalPence,
            currency: retreatDate.currency,
          },
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
  const paidInFull = booking.balanceAmountPence <= 0;
  const paidAmountLabel = paidInFull ? "Payment received" : "Deposit paid";
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
    }),
    textBody: `${paidInFull ? "Payment" : "Deposit"} received for ${booking.retreatDate.retreatTitleSnapshot}\nDates: ${formatDateRange(booking.retreatDate.startsAt, booking.retreatDate.endsAt)}\n${paidAmountLabel}: ${formatCurrency(paidInFull ? booking.totalPricePence : booking.depositAmountPence, booking.currency)}\nRemaining balance: ${formatCurrency(booking.balanceAmountPence, booking.currency)}\nDetails: ${retreatDetailsUrl}`,
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
    });

    if (instalmentSequence === 1) {
      await assignRoomUnitAfterPayment(booking.id);
      await ensureRetreatOnlineAccessEntitlement(booking.id);
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
    await assignRoomUnitAfterPayment(booking.id);
    await ensureRetreatOnlineAccessEntitlement(booking.id);
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
    include: { retreatDate: true, roomOption: true },
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
    dietaryRequirements: booking.dietaryRequirements,
    medicalConditions: booking.medicalConditions,
    mobilityNeeds: booking.mobilityNeeds,
    dailyRoomUrl: booking.retreatDate.dailyRoomUrl,
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
    dietaryRequirements: booking.dietaryRequirements,
    medicalConditions: booking.medicalConditions,
    mobilityNeeds: booking.mobilityNeeds,
    dailyRoomUrl: null,
    onlineAccess:
      booking.retreatDate.retreatType === "online"
        ? await getRetreatOnlineAccessState(booking.id, userId)
        : null,
    emergencyContactName: booking.emergencyContactName,
    emergencyContactPhone: booking.emergencyContactPhone,
    canPayBalance: booking.paymentStatus !== "paid_in_full" && booking.balanceAmountPence > 0,
  };
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

  let retreatDate = booking.retreatDate;
  if (!retreatDate.dailyRoomName || !retreatDate.dailyRoomUrl) {
    retreatDate = await setUpRetreatOnlineRoom(retreatDate.id);
  }
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

export type CreateAdminRetreatDateInput = {
  retreatSlug: string;
  title: string;
  location: string;
  retreatType: "in_person" | "online";
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  pricePence: number;
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

  const externalDateId = buildRetreatDateExternalId(input);
  const isOnline = input.retreatType === "online";

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
        capacity: input.capacity,
        status: "open",
        currency: "GBP",
        pricePence: input.pricePence,
        depositAmountPence: isOnline ? input.pricePence : Math.round(input.pricePence * 0.2),
        balanceDueAt: isOnline ? null : new Date(input.startsAt.getTime() - 56 * 86400000),
        isRecorded: isOnline,
        replayAccessDurationDays: isOnline ? 7 : null,
        paymentPlanSnapshotJson: {
          depositType: isOnline ? "full_payment" : "percentage",
          depositPercentageBasisPoints: isOnline ? null : 2000,
          balanceDueDaysBeforeStart: isOnline ? null : 56,
        },
      },
    });

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
        guestsIncluded: 1,
        guestCountPerUnit: 1,
        capacity: input.capacity,
        availableSpots: input.capacity,
        pricePence: input.pricePence,
        depositAmountPence: isOnline ? input.pricePence : Math.round(input.pricePence * 0.2),
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
        depositType: isOnline ? RetreatDepositType.full_payment : RetreatDepositType.percentage,
        depositPercentageBasisPoints: isOnline ? null : 2000,
        fixedDepositAmountPence: isOnline ? input.pricePence : null,
        balanceDueAt: isOnline ? null : new Date(input.startsAt.getTime() - 56 * 86400000),
        balanceDueDaysBeforeStart: isOnline ? null : 56,
        active: true,
      },
    });

    return retreatDate;
  });
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
      retreatDate.endsAt
    );
    const updated = await db.retreatDate.update({
      where: { id: retreatDate.id },
      data: {
        dailyRoomName: room.roomName,
        dailyRoomUrl: room.roomUrl,
        onlineRoomSetupStatus: ClassRoomSetupStatus.ready,
        onlineRoomSetupError: null,
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
      roomOptions: {
        orderBy: { displayOrder: "asc" },
        include: {
          ratePlans: { orderBy: { guestCount: "asc" } },
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

export type AdminRetreatEarlyBirdRateUpdate = {
  ratePlanId: string;
  earlyBirdPricePence: number | null;
  earlyBirdEndsAt: Date | null;
};

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
        roomOptions: {
          select: {
            ratePlans: {
              select: { id: true, totalPricePence: true },
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
