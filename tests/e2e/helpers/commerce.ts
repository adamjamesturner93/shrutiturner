import {
  GiftDeliveryTarget,
  GiftPurchaseStatus,
  GiftType,
  RetreatBookingStatus,
  RetreatPaymentStatus,
  SmallGroupProgrammeStatus,
} from "@prisma/client";
import { db } from "@/lib/db";

const E2E_COMMERCE_PREFIX = "e2e-commerce-";

function uniqueSuffix(label: string) {
  return `${E2E_COMMERCE_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function cleanupE2ECommerceData() {
  await db.giftPurchase.deleteMany({
    where: {
      OR: [
        { code: { startsWith: "E2E-" } },
        { productSlug: { startsWith: E2E_COMMERCE_PREFIX } },
      ],
    },
  });

  await db.retreatBooking.deleteMany({
    where: {
      OR: [
        { balancePaymentUrlToken: { startsWith: E2E_COMMERCE_PREFIX } },
        { purchaserEmail: { contains: E2E_COMMERCE_PREFIX } },
      ],
    },
  });

  await db.retreatRoomOption.deleteMany({
    where: { externalRoomOptionId: { startsWith: E2E_COMMERCE_PREFIX } },
  });

  await db.retreatDate.deleteMany({
    where: { externalDateId: { startsWith: E2E_COMMERCE_PREFIX } },
  });

  await db.smallGroupProgramme.deleteMany({
    where: {
      OR: [
        { slug: { startsWith: E2E_COMMERCE_PREFIX } },
        { runSlug: { startsWith: E2E_COMMERCE_PREFIX } },
      ],
    },
  });
}

export async function createE2ESmallGroupRun() {
  const suffix = uniqueSuffix("small-group");
  const programme = await db.smallGroupProgramme.create({
    data: {
      slug: suffix,
      runSlug: suffix,
      templateSlug: "shoulder-resilience",
      title: "Shoulder Resilience & Mobility",
      subtitle: "E2E seeded checkout run",
      shortDescription: "E2E seeded checkout run.",
      description: "E2E seeded checkout run.",
      longDescription: "E2E seeded checkout run.",
      durationLabel: "6 weeks",
      durationWeeks: 6,
      cohortSize: 6,
      startDate: new Date("2026-09-01T18:00:00.000Z"),
      endDate: new Date("2026-10-13T18:00:00.000Z"),
      scheduleLabel: "Tuesdays at 18:00",
      pricePence: 16500,
      sessionsPerWeek: 2,
      totalSessions: 12,
      status: SmallGroupProgrammeStatus.open,
      ctaLabel: "Join this programme",
      ctaHref: "/classes/small-groups/shoulder-resilience",
      whoItsForJson: [],
      equipmentJson: [],
      inclusionsJson: [],
      weekByWeekJson: [],
    },
  });

  return programme;
}

export async function createE2EProgrammeGift(programmeId: string) {
  const suffix = uniqueSuffix("gift");

  const gift = await db.giftPurchase.create({
    data: {
      code: `E2E-GIFT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      type: GiftType.small_group,
      status: GiftPurchaseStatus.purchased,
      purchaserFirstName: "Gift",
      purchaserLastName: "Sender",
      purchaserEmail: `${suffix}@example.com`,
      recipientFirstName: "Taylor",
      recipientLastName: "Jordan",
      recipientEmail: `taylor+${suffix}@example.com`,
      recipientMessage: "Enjoy this programme.",
      deliveryTarget: GiftDeliveryTarget.recipient,
      productSlug: suffix,
      productTitleSnapshot: "Shoulder Resilience & Mobility Gift",
      currency: "GBP",
      totalPaidPence: 16500,
      smallGroupProgrammeId: programmeId,
      purchasedAt: new Date(),
    },
  });

  return gift;
}

export async function createE2EBalanceBooking() {
  const suffix = uniqueSuffix("balance");

  const retreatDate = await db.retreatDate.create({
    data: {
      externalDateId: `${suffix}-date`,
      retreatSlug: "sankalpa",
      retreatTitleSnapshot: "Sankalpa",
      retreatLocationSnapshot: "Portuguese Countryside",
      startsAt: new Date("2026-09-15T08:00:00.000Z"),
      endsAt: new Date("2026-09-20T12:00:00.000Z"),
      capacity: 12,
      pricePence: 165000,
      depositAmountPence: 30000,
      currency: "GBP",
    },
  });

  const booking = await db.retreatBooking.create({
    data: {
      retreatDateId: retreatDate.id,
      purchaserFirstName: "Balance",
      purchaserLastName: "Buyer",
      purchaserEmail: `${suffix}@example.com`,
      attendeeFirstName: "Balance",
      attendeeLastName: "Buyer",
      attendeeEmail: `${suffix}@example.com`,
      phone: "07123456789",
      emergencyContactName: "Emergency Contact",
      emergencyContactPhone: "07987654321",
      totalPricePence: 165000,
      depositAmountPence: 30000,
      balanceAmountPence: 135000,
      depositPaidPence: 30000,
      currency: "GBP",
      paymentStatus: RetreatPaymentStatus.deposit_paid,
      bookingStatus: RetreatBookingStatus.balance_due,
      balancePaymentUrlToken: `${suffix}-token`,
      balanceDueAt: new Date("2026-08-15T12:00:00.000Z"),
    },
  });

  return booking;
}
