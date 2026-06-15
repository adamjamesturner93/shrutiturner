import { db } from "./db";
import { uniqueToken } from "./_shared";

const SMALL_GROUP_SLUG_PREFIX = "e2e-commerce-programme";
const SMALL_GROUP_RUN_PREFIX = "e2e-commerce-run";
const GIFT_CODE_PREFIX = "E2ECOMMERCE";
const RETREAT_EXTERNAL_PREFIX = "e2e-commerce-retreat";
const BALANCE_TOKEN_PREFIX = "e2e-commerce-balance";
const PURCHASER_EMAIL_PREFIX = "e2e-commerce+";

export async function cleanupE2ECommerceData() {
  await db.giftPurchase.deleteMany({
    where: {
      OR: [
        { code: { startsWith: GIFT_CODE_PREFIX } },
        { purchaserEmail: { startsWith: PURCHASER_EMAIL_PREFIX } },
        { recipientEmail: { startsWith: PURCHASER_EMAIL_PREFIX } },
      ],
    },
  });

  await db.retreatBooking.deleteMany({
    where: {
      OR: [
        { balancePaymentUrlToken: { startsWith: BALANCE_TOKEN_PREFIX } },
        { purchaserEmail: { startsWith: PURCHASER_EMAIL_PREFIX } },
        { attendeeEmail: { startsWith: PURCHASER_EMAIL_PREFIX } },
      ],
    },
  });

  const retreatDates = await db.retreatDate.findMany({
    where: {
      externalDateId: {
        startsWith: RETREAT_EXTERNAL_PREFIX,
      },
    },
    select: {
      id: true,
    },
  });

  if (retreatDates.length) {
    const retreatDateIds = retreatDates.map((item) => item.id);
    await db.retreatRoomOption.deleteMany({
      where: {
        retreatDateId: {
          in: retreatDateIds,
        },
      },
    });
    await db.retreatDate.deleteMany({
      where: {
        id: {
          in: retreatDateIds,
        },
      },
    });
  }

  await db.smallGroupProgramme.deleteMany({
    where: {
      OR: [
        { slug: { startsWith: SMALL_GROUP_SLUG_PREFIX } },
        { runSlug: { startsWith: SMALL_GROUP_RUN_PREFIX } },
      ],
    },
  });
}

export async function createE2ESmallGroupRun() {
  const token = uniqueToken("shoulder-resilience");

  return db.smallGroupProgramme.create({
    data: {
      slug: `${SMALL_GROUP_SLUG_PREFIX}-${token}`,
      runSlug: `${SMALL_GROUP_RUN_PREFIX}-${token}`,
      templateSlug: "shoulder-resilience",
      title: "Shoulder Resilience & Mobility",
      subtitle: "A small group progression for steadier shoulders and stronger movement.",
      shortDescription: "A guided small group block focused on shoulder resilience and mobility.",
      description: "A guided small group block focused on shoulder resilience and mobility.",
      durationLabel: "6 weeks",
      durationWeeks: 6,
      cohortSize: 12,
      startDate: new Date("2026-05-05T18:00:00.000Z"),
      endDate: new Date("2026-06-09T18:00:00.000Z"),
      scheduleLabel: "Tuesdays at 18:00",
      pricePence: 12900,
      sessionsPerWeek: 1,
      totalSessions: 6,
      status: "open",
      ctaLabel: "Join this programme",
      ctaHref: "/classes/small-groups/shoulder-resilience",
    },
  });
}

export async function createE2EProgrammeGift(programmeId: string) {
  const programme = await db.smallGroupProgramme.findUniqueOrThrow({
    where: { id: programmeId },
  });

  return db.giftPurchase.create({
    data: {
      code: `${GIFT_CODE_PREFIX}${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`,
      type: "small_group",
      status: "purchased",
      purchaserFirstName: "Taylor",
      purchaserLastName: "Jordan",
      purchaserEmail: `${PURCHASER_EMAIL_PREFIX}${uniqueToken("purchaser")}@example.com`,
      recipientFirstName: "Chris",
      recipientLastName: "Friend",
      recipientEmail: `${PURCHASER_EMAIL_PREFIX}${uniqueToken("recipient")}@example.com`,
      recipientMessage: "Enjoy this programme.",
      deliveryTarget: "recipient",
      productSlug: programme.templateSlug,
      productTitleSnapshot: "Shoulder Resilience & Mobility Gift",
      totalPaidPence: programme.pricePence,
      currency: "GBP",
      smallGroupProgrammeId: programme.id,
      purchasedAt: new Date(),
    },
  });
}

export async function createE2EBalanceBooking() {
  const token = uniqueToken("balance");
  const purchaserEmail = `${PURCHASER_EMAIL_PREFIX}${uniqueToken("booking")}@example.com`;

  const retreatDate = await db.retreatDate.create({
    data: {
      externalDateId: `${RETREAT_EXTERNAL_PREFIX}-${token}`,
      retreatSlug: "e2e-sankalpa",
      retreatTitleSnapshot: "Sankalpa Retreat",
      retreatLocationSnapshot: "Somerset, UK",
      startsAt: new Date("2026-09-10T15:00:00.000Z"),
      endsAt: new Date("2026-09-13T10:00:00.000Z"),
      capacity: 12,
      pricePence: 165000,
      depositAmountPence: 30000,
      currency: "GBP",
      status: "open",
      balanceDueAt: new Date("2026-08-10T00:00:00.000Z"),
    },
  });

  const roomOption = await db.retreatRoomOption.create({
    data: {
      retreatDateId: retreatDate.id,
      externalRoomOptionId: `shared-${token}`,
      label: "Shared Twin",
      description: "Twin room with shared facilities.",
      roomType: "shared_twin",
      guestsIncluded: 1,
      capacity: 4,
      availableSpots: 4,
      pricePence: 165000,
      depositAmountPence: 30000,
    },
  });

  return db.retreatBooking.create({
    data: {
      retreatDateId: retreatDate.id,
      roomOptionId: roomOption.id,
      purchaserFirstName: "Taylor",
      purchaserLastName: "Jordan",
      purchaserEmail,
      attendeeFirstName: "Taylor",
      attendeeLastName: "Jordan",
      attendeeEmail: purchaserEmail,
      phone: "07123456789",
      emergencyContactName: "Alex Jordan",
      emergencyContactPhone: "07111222333",
      roomOptionLabelSnapshot: roomOption.label,
      roomOptionTypeSnapshot: roomOption.roomType,
      totalPricePence: 165000,
      depositAmountPence: 30000,
      balanceAmountPence: 135000,
      depositPaidPence: 30000,
      balancePaidPence: 0,
      currency: "GBP",
      paymentStatus: "deposit_paid",
      bookingStatus: "deposit_paid",
      balancePaymentUrlToken: `${BALANCE_TOKEN_PREFIX}-${token}`,
      balanceDueAt: retreatDate.balanceDueAt,
    },
  });
}
