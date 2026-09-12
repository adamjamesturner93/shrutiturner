import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
  retreatDate: { findFirstOrThrow: vi.fn(), findMany: vi.fn() },
  retreatRoomOption: { findUnique: vi.fn() },
  retreatBooking: { count: vi.fn(), aggregate: vi.fn(), create: vi.fn(), update: vi.fn() },
  giftPurchase: { count: vi.fn(), aggregate: vi.fn(), create: vi.fn(), update: vi.fn() },
  guestAcceptanceEvent: { createMany: vi.fn() },
};
const stripeCreate = vi.fn();
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({ checkout: { sessions: { create: stripeCreate } } }),
}));
vi.mock("@/lib/legal/policy-service", () => ({
  getCurrentPolicyVersions: async (types: string[]) =>
    types.map((type) => ({ id: type, version: "1" })),
}));
vi.mock("@/lib/postmark/client", () => ({ sendPostmarkReactEmail: vi.fn() }));
const { createRetreatCheckout, getAdminRetreatSummaries } = await import("@/lib/retreats/service");

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
  depositRules: [{ active: true, depositType: "full_payment" }],
  addons: [],
  bookings: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation((callback: (tx: typeof db) => Promise<unknown>) =>
    callback(db)
  );
  db.retreatDate.findFirstOrThrow.mockResolvedValue(date);
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
