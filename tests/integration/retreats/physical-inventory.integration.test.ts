import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        create: vi.fn(async () => ({
          id: `test_${randomUUID()}`,
          url: "https://example.test/checkout",
        })),
      },
    },
  }),
}));
vi.mock("@/lib/legal/policy-service", () => ({
  getCurrentPolicyVersions: async (types: string[]) =>
    types.map(() => ({ version: "test-current" })),
}));
vi.mock("@/lib/postmark/client", () => ({ sendPostmarkReactEmail: vi.fn() }));
import { createRetreatCheckout, assignRoomUnitAfterPayment } from "@/lib/retreats/service";
const prefix = `inventory-test-${randomUUID()}`;
const dateId = `${prefix}-date`,
  poolId = `${prefix}-pool`,
  groupId = `${prefix}-group`,
  venueId = `${prefix}-venue`;
const url = process.env.DATABASE_URL || "";
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname))
  throw new Error("Inventory integration tests require local Postgres.");
const book = (kind: "shared" | "private", guestCount = 1) =>
  createRetreatCheckout({
    retreatSlug: prefix,
    retreatDateId: dateId,
    roomOptionId: `${prefix}-${kind}`,
    guestCount,
    purchaseMode: "self",
    paymentOption: "pay_in_full",
    purchaserFirstName: "Inventory",
    purchaserLastName: "Test",
    purchaserEmail: `${randomUUID()}@example.test`,
    acceptedTermsVersion: "test-current",
    ...(kind === "private" && guestCount === 2 ? { bedPreference: "twin" } : {}),
  });
describe("physical room checkout reservations", () => {
  beforeAll(async () => {
    await db.retreatVenueProfile.create({
      data: { id: venueId, venueSlug: prefix, contentfulVenueId: prefix, name: prefix },
    });
    await db.retreatVenueRoomGroup.create({
      data: {
        id: groupId,
        venueProfileId: venueId,
        name: "Convertible",
        quantity: 1,
        capacityPerRoom: 2,
        bedSetup: "convertible_double_twin",
        bathroomType: "private",
        allowShared: true,
      },
    });
    await db.retreatDate.create({
      data: {
        id: dateId,
        externalDateId: dateId,
        retreatSlug: prefix,
        retreatTitleSnapshot: prefix,
        retreatLocationSnapshot: "Test",
        startsAt: new Date("2099-06-11"),
        endsAt: new Date("2099-06-13"),
        capacity: 10,
        pricePence: 45000,
        depositAmountPence: 45000,
        status: "open",
        eventKind: "residential_retreat",
        requiresOfferingClearance: false,
      },
    });
    await db.retreatInventoryPool.create({
      data: {
        id: poolId,
        retreatDateId: dateId,
        inventoryType: "bed_space",
        name: prefix,
        totalQuantity: 2,
      },
    });
    for (const kind of ["shared", "private"] as const)
      await db.retreatRoomOption.create({
        data: {
          id: `${prefix}-${kind}`,
          externalRoomOptionId: `${prefix}-${kind}`,
          retreatDateId: dateId,
          inventoryPoolId: poolId,
          venueRoomGroupId: groupId,
          label: kind,
          roomType: kind === "shared" ? "shared_twin" : "private",
          bookingUnit: kind === "shared" ? "bed_space" : "whole_room",
          inventoryUnitsPerBooking: kind === "shared" ? 1 : 2,
          capacity: kind === "shared" ? 2 : 1,
          availableSpots: kind === "shared" ? 2 : 1,
          pricePence: kind === "shared" ? 45000 : 55000,
          allowedGuestCountsJson: kind === "shared" ? [1] : [1, 2],
          ratePlans: {
            create:
              kind === "shared"
                ? [{ guestCount: 1, totalPricePence: 45000 }]
                : [
                    { guestCount: 1, totalPricePence: 55000 },
                    { guestCount: 2, totalPricePence: 90000 },
                  ],
          },
        },
      });
    await db.retreatRoomUnit.create({
      data: {
        id: `${prefix}-unit`,
        retreatDateId: dateId,
        roomOptionId: `${prefix}-private`,
        inventoryPoolId: poolId,
        label: "Test room",
        capacityUnits: 2,
      },
    });
    await db.retreatDepositRule.create({
      data: { retreatDateId: dateId, depositType: "full_payment" },
    });
  });
  beforeEach(async () => {
    await db.retreatBooking.deleteMany({ where: { retreatDateId: dateId } });
  });
  afterAll(async () => {
    await db.retreatBooking.deleteMany({ where: { retreatDateId: dateId } });
    await db.retreatDate.deleteMany({ where: { id: dateId } });
    await db.retreatVenueProfile.deleteMany({ where: { id: venueId } });
  });
  it("first shared hold blocks private purchase but allows a second shared purchase", async () => {
    await book("shared");
    await expect(book("private")).rejects.toThrow("ROOM_OPTION_UNAVAILABLE");
    await book("shared");
    await expect(book("shared")).rejects.toThrow("ROOM_OPTION_UNAVAILABLE");
  });
  it.each([1, 2])("private booking for %s consumes both beds", async (guests) => {
    await book("private", guests);
    await expect(book("shared")).rejects.toThrow("ROOM_OPTION_UNAVAILABLE");
  });
  it("serializes competing shared/private checkouts", async () => {
    const results = await Promise.allSettled([book("private"), book("shared")]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db.retreatBooking.count({ where: { retreatDateId: dateId } })).toBe(1);
  });
  it("released holds restore availability and shared assignment preserves the second bed", async () => {
    const held = await book("private");
    await db.retreatBooking.update({
      where: { id: held.bookingId },
      data: { bookingStatus: "cancelled" },
    });
    const first = await book("shared");
    await db.retreatBooking.update({
      where: { id: first.bookingId },
      data: { bookingStatus: "deposit_paid" },
    });
    expect(await assignRoomUnitAfterPayment(first.bookingId!)).toBe(`${prefix}-unit`);
    await book("shared");
  });
  it("rejects two attendees buying a single shared place", async () => {
    await expect(book("shared", 2)).rejects.toThrow();
  });
});
