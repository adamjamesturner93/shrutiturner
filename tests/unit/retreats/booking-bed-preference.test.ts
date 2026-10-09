import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const db = {
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
  retreatDate: { findUnique: vi.fn(), findFirstOrThrow: vi.fn(), findMany: vi.fn() },
  retreatRoomOption: { findUnique: vi.fn() },
  retreatBookingItem: { update: vi.fn() },
  retreatBookingInstalment: { updateMany: vi.fn(), findMany: vi.fn() },
  retreatBooking: {
    findUnique: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  giftPurchase: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  guestAcceptanceEvent: { createMany: vi.fn() },
};
const paymentResolve = vi.fn();
vi.mock("@/lib/retreats/workshop-payment", () => ({
  getWorkshopPayment: (...args: unknown[]) => paymentResolve(...args),
}));
const stripeCreate = vi.fn();
const promotionResolve = vi.fn();
vi.mock("@/lib/retreats/workshop-discounts", () => ({
  workshopStripeProduct: (...args: unknown[]) => promotionResolve(...args),
}));
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({ checkout: { sessions: { create: stripeCreate } } }),
}));
vi.mock("@/lib/legal/policy-service", () => ({
  getCurrentPolicyVersions: async (types: string[]) =>
    types.map((type) => ({ id: type, version: "1" })),
}));
vi.mock("@/lib/postmark/client", () => ({ sendPostmarkReactEmail: vi.fn() }));
const { createRetreatCheckout, getAdminRetreatSummaries, processRetreatCheckoutCompleted } =
  await import("@/lib/retreats/service");

const input = {
  retreatSlug: "test-retreat",
  retreatDateId: "date-1",
  roomOptionId: "private-room",
  guestCount: 2,
  purchaseMode: "self" as const,
  paymentOption: "pay_in_full" as const,
  purchaserFirstName: "Test",
  purchaserLastName: "Guest",
  purchaserEmail: "test@example.com",
  acceptedTermsVersion: "1",
  acceptedHealthWaiverVersion: "1",
  acceptedHealthDataVersion: "1",
};
const room = {
  id: "room-1",
  active: true,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  externalRoomOptionId: "private-room",
  label: "Convertible private room",
  roomType: "private",
  bookingUnit: "whole_room",
  inventoryUnitsPerBooking: 1,
  inventoryPoolId: null,
  guestsIncluded: 1,
  capacity: 2,
  pricePence: 52500,
  allowedGuestCountsJson: [1, 2],
  venueRoomGroup: { bedSetup: "convertible_double_twin" },
  ratePlans: [
    { id: "rate-1", guestCount: 1, totalPricePence: 52500, active: true },
    { id: "rate-2", guestCount: 2, totalPricePence: 91000, active: true },
  ],
};
const date = {
  id: "date-db",
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  externalDateId: "date-1",
  status: "open",
  retreatType: "in_person",
  startsAt: new Date("2030-09-18T15:00:00Z"),
  endsAt: new Date("2030-09-20T13:00:00Z"),
  retreatTitleSnapshot: "Test retreat",
  currency: "GBP",
  capacity: 10,
  pricePence: 52500,
  roomOptions: [room],
  payInFullDiscountEnabled: true,
  payInFullDiscountPercent: 5,
  payInFullDiscountCapPence: 5000,
  depositRules: [{ active: true, depositType: "percentage", depositPercentageBasisPoints: 2500 }],
  addons: [],
  bookings: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation((callback: (tx: typeof db) => Promise<unknown>) =>
    callback(db)
  );
  db.retreatDate.findFirstOrThrow.mockResolvedValue(date);
  db.retreatDate.findUnique.mockResolvedValue(date);
  db.retreatRoomOption.findUnique.mockResolvedValue(room);
  db.retreatBooking.count.mockResolvedValue(0);
  db.giftPurchase.count.mockResolvedValue(0);
  db.retreatBooking.aggregate.mockResolvedValue({ _sum: { attendeeCount: 0 } });
  db.giftPurchase.aggregate.mockResolvedValue({ _sum: { retreatGuestCount: 0 } });
  db.retreatBooking.create.mockResolvedValue({ id: "booking-1" });
  db.giftPurchase.create.mockResolvedValue({ id: "gift-1" });
  stripeCreate.mockResolvedValue({ id: "checkout-1", url: "https://checkout.stripe.test/1" });
});

describe("bed preference booking persistence", () => {
  it("rejects a quote if venue inventory changed while checkout was reserving capacity", async () => {
    db.retreatDate.findUnique.mockResolvedValue({
      ...date,
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    });
    await expect(createRetreatCheckout({ ...input, bedPreference: "twin" })).rejects.toThrow(
      "ROOM_OPTION_UNAVAILABLE"
    );
    expect(db.retreatBooking.create).not.toHaveBeenCalled();
    expect(stripeCreate).not.toHaveBeenCalled();
  });
  it("requires different email addresses for two guests", async () => {
    await expect(
      createRetreatCheckout({
        ...input,
        bedPreference: "twin",
        guestTwoEmail: " TEST@example.com ",
      })
    ).rejects.toThrow("SECOND_GUEST_EMAIL_MUST_DIFFER");
    expect(db.retreatBooking.create).not.toHaveBeenCalled();
    expect(stripeCreate).not.toHaveBeenCalled();
  });
  it.each(["double", "twin"])(
    "stores %s while consuming one room at the same two-guest price",
    async (bedPreference) => {
      await createRetreatCheckout({ ...input, bedPreference });
      expect(db.retreatBooking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bedPreference,
            attendeeCount: 2,
            totalPricePence: 91000,
            items: {
              create: [
                expect.objectContaining({
                  roomOptionId: "room-1",
                  quantity: 1,
                  guestCount: 2,
                  totalPricePence: 91000,
                }),
              ],
            },
          }),
        })
      );
    }
  );
  it("rejects a missing preference before creating a booking or payment", async () => {
    await expect(createRetreatCheckout(input)).rejects.toThrow("RETREAT_BED_PREFERENCE_REQUIRED");
    expect(db.retreatBooking.create).not.toHaveBeenCalled();
    expect(stripeCreate).not.toHaveBeenCalled();
  });
  it("retains the choice on a gift purchase for later redemption", async () => {
    await createRetreatCheckout({
      ...input,
      bedPreference: "twin",
      purchaseMode: "gift",
      recipientFirstName: "Gift",
      recipientLastName: "Guest",
      recipientEmail: "gift@example.com",
    });
    expect(db.giftPurchase.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          retreatBedPreference: "twin",
          retreatGuestCount: 2,
          totalPaidPence: 91000,
        }),
      })
    );
  });
});

describe("admin price summary", () => {
  it("distinguishes varied room prices from a single-price workshop", async () => {
    db.retreatDate.findMany.mockResolvedValue([
      date,
      {
        ...date,
        id: "workshop",
        roomOptions: [{ pricePence: 3500, ratePlans: [{ guestCount: 1, totalPricePence: 3500 }] }],
      },
    ]);
    const results = await getAdminRetreatSummaries();
    expect(results[0]).toMatchObject({ currentPricePence: 52500, priceVaries: true });
    expect(results[1]).toMatchObject({ currentPricePence: 3500, priceVaries: false });
    expect(db.retreatDate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          roomOptions: expect.objectContaining({ where: { active: true } }),
        }),
      })
    );
  });
});

describe("workshop promotion checkout", () => {
  it.each(["self", "gift"] as const)(
    "enables Stripe code entry for a %s workshop without pre-applying a discount",
    async (purchaseMode) => {
      const workshopDate = {
        ...date,
        eventKind: "in_person_workshop",
        depositRules: [{ active: true, depositType: "full_payment" }],
      };
      db.retreatDate.findFirstOrThrow.mockResolvedValue(workshopDate);
      db.retreatDate.findUnique.mockResolvedValue(workshopDate);
      promotionResolve.mockResolvedValue("prod_workshop");
      await createRetreatCheckout({
        ...input,
        purchaseMode,
        guestCount: 1,
        recipientFirstName: "Gift",
        recipientLastName: "Guest",
        recipientEmail: "gift@example.com",
      });
      expect(stripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          allow_promotion_codes: true,
          metadata: expect.objectContaining({ workshopDiscountVersion: "2" }),
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({ product: "prod_workshop", unit_amount: 52500 }),
            }),
          ],
        })
      );
      const create = purchaseMode === "gift" ? db.giftPurchase.create : db.retreatBooking.create;
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            originalTotalPence: 52500,
            ...(purchaseMode === "gift"
              ? { totalPaidPence: 52500 }
              : { totalPricePence: 52500, balanceAmountPence: 0 }),
          }),
        })
      );
    }
  );
});

describe("Stripe workshop settlement", () => {
  const event = {
    id: "cs",
    metadata: { kind: "retreat_instalment", bookingId: "booking-1", workshopDiscountVersion: "2" },
    payment_status: "paid",
  } as unknown as Stripe.Checkout.Session;
  it.each([2800, 0])("settles the actual %i pence amount before fulfilment", async (total) => {
    db.retreatBooking.findUnique.mockReset();
    db.retreatBooking.findUnique
      .mockResolvedValueOnce({
        id: "booking-1",
        currency: "GBP",
        stripeDepositSessionId: "cs",
        totalPricePence: 3500,
        originalTotalPence: 3500,
        items: [{ id: "item", unitPricePence: 3500, quantity: 1 }],
        retreatDate: { ...date, retreatType: "online", stripeWorkshopProductId: "prod" },
      })
      .mockResolvedValue(null);
    paymentResolve.mockResolvedValue({
      totalPence: total,
      originalTotalPence: 3500,
      promotionDiscountPence: 3500 - total,
      promotionCodeSnapshot: "SAVE",
      stripePromotionCodeId: "promo",
      items: [{ id: "item", totalPence: total }],
    });
    db.retreatBookingInstalment.updateMany.mockResolvedValue({ count: 1 });
    db.retreatBookingInstalment.findMany.mockResolvedValue([
      { status: "paid", kind: "full_payment", amountPence: total },
    ]);
    expect(await processRetreatCheckoutCompleted(event)).toBe(true);
    expect(db.retreatBookingInstalment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountPence: total, status: "paid" }),
      })
    );
    expect(db.retreatBooking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalPricePence: total,
          balanceAmountPence: 0,
          paymentStatus: "paid_in_full",
          promotionDiscountPence: 3500 - total,
          nonRefundableAmountPence: total ? 1000 : 0,
        }),
      })
    );
    expect(db.retreatBookingItem.update).toHaveBeenCalledWith({
      where: { id: "item" },
      data: { totalPricePence: total },
    });
  });
  it("does not apply a repeated webhook twice", async () => {
    db.retreatBooking.findUnique.mockResolvedValue({
      id: "booking-1",
      currency: "GBP",
      items: [],
      retreatDate: date,
    });
    paymentResolve.mockResolvedValue({ totalPence: 0, items: [] });
    db.retreatBookingInstalment.updateMany.mockResolvedValue({ count: 0 });
    expect(await processRetreatCheckoutCompleted(event)).toBe(true);
    expect(db.retreatBooking.update).not.toHaveBeenCalled();
    expect(db.retreatBookingItem.update).not.toHaveBeenCalled();
  });
});

describe("discounted workshop gift settlement", () => {
  it.each([2800, 0])("records the %i pence gift payment before redemption", async (total) => {
    const { processGiftPurchaseCheckoutCompleted } = await import("@/lib/gifts/service");
    db.giftPurchase.findUnique.mockReset();
    db.giftPurchase.findUnique
      .mockResolvedValueOnce({
        id: "gift-1",
        status: "pending_payment",
        deliveryEmailSentAt: new Date(),
        currency: "GBP",
        totalPaidPence: 3500,
        originalTotalPence: 3500,
        stripeCheckoutSessionId: "cs",
        retreatDate: { ...date, retreatType: "online", stripeWorkshopProductId: "prod" },
      })
      .mockResolvedValue(null);
    paymentResolve.mockResolvedValue({
      totalPence: total,
      originalTotalPence: 3500,
      promotionDiscountPence: 3500 - total,
      promotionCodeSnapshot: "SAVE",
      stripePromotionCodeId: "promo",
    });
    db.giftPurchase.updateMany.mockResolvedValue({ count: 1 });
    const event = {
      id: "cs",
      metadata: { kind: "retreat_gift", giftPurchaseId: "gift-1", workshopDiscountVersion: "2" },
    } as unknown as Stripe.Checkout.Session;
    expect(await processGiftPurchaseCheckoutCompleted(event)).toBe(true);
    expect(db.giftPurchase.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "gift-1", status: { in: ["pending_payment", "expired"] } },
        data: expect.objectContaining({
          status: "purchased",
          totalPaidPence: total,
          promotionDiscountPence: 3500 - total,
          nonRefundableAmountPence: total ? 1000 : 0,
        }),
      })
    );
  });
  it("does not revert a redeemed gift on a repeated webhook", async () => {
    const { processGiftPurchaseCheckoutCompleted } = await import("@/lib/gifts/service");
    db.giftPurchase.findUnique.mockResolvedValue({
      id: "gift-1",
      status: "redeemed",
      deliveryEmailSentAt: new Date(),
    });
    db.giftPurchase.updateMany.mockResolvedValue({ count: 0 });
    const event = {
      id: "cs",
      metadata: { kind: "retreat_gift", giftPurchaseId: "gift-1" },
    } as unknown as Stripe.Checkout.Session;
    expect(await processGiftPurchaseCheckoutCompleted(event)).toBe(true);
    expect(db.giftPurchase.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "gift-1", status: { in: ["pending_payment", "expired"] } },
      })
    );
    expect(db.giftPurchase.update).not.toHaveBeenCalled();
  });
});
