import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { applyVenueRoomSync, previewVenueRoomSync } from "@/lib/retreats/venue-sync-service";

const key = `integration-venue-sync-${randomUUID()}`;
let venueId: string;
let dateId: string;
let groupId: string;
let actorUserId: string;
async function preview() {
  return (await previewVenueRoomSync(key))[0];
}
async function apply() {
  const plan = await preview();
  return applyVenueRoomSync({
    contentfulVenueId: key,
    dateId,
    revision: plan.revision,
    prices: Object.fromEntries(plan.prices.map((price) => [price.key, price.guestCount * 42500])),
    actorUserId,
  });
}
describe("reviewed venue synchronisation", () => {
  beforeAll(async () => {
    actorUserId = (await db.user.create({ data: { email: `${key}@example.test`, role: "admin" } }))
      .id;
    const venue = await db.retreatVenueProfile.create({
      data: {
        contentfulVenueId: key,
        venueSlug: key,
        name: "Synthetic venue",
        roomGroups: {
          create: {
            name: "King",
            quantity: 1,
            capacityPerRoom: 2,
            bedSetup: "fixed_double",
            allowShared: false,
            privateGuestCountsJson: [1, 2],
            roomTemplates: { create: { label: "Green" } },
          },
        },
      },
      include: { roomGroups: true },
    });
    venueId = venue.id;
    groupId = venue.roomGroups[0].id;
    dateId = (
      await db.retreatDate.create({
        data: {
          externalDateId: key,
          retreatSlug: key,
          retreatTitleSnapshot: "Synthetic retreat",
          retreatLocationSnapshot: "Synthetic venue",
          startsAt: new Date("2099-06-01T15:00:00Z"),
          endsAt: new Date("2099-06-03T11:00:00Z"),
          capacity: 2,
          pricePence: 42500,
          depositAmountPence: 10625,
          venueProfileId: venue.id,
        },
      })
    ).id;
  });
  afterAll(async () => {
    await db.adminActionLog.deleteMany({ where: { actorUserId } });
    if (dateId) await db.retreatBooking.deleteMany({ where: { retreatDateId: dateId } });
    if (dateId) await db.retreatDate.delete({ where: { id: dateId } });
    if (venueId) await db.retreatVenueProfile.delete({ where: { id: venueId } });
    if (actorUserId) await db.user.delete({ where: { id: actorUserId } });
  });
  it("previews new prices, rejects missing prices, then creates shared physical inventory once", async () => {
    const plan = await preview();
    expect(plan.prices).toHaveLength(2);
    await expect(
      applyVenueRoomSync({
        contentfulVenueId: key,
        dateId,
        revision: plan.revision,
        prices: {},
        actorUserId,
      })
    ).rejects.toThrow("VENUE_SYNC_PRICE_REQUIRED");
    expect(await db.retreatRoomOption.count({ where: { retreatDateId: dateId } })).toBe(0);
    await apply();
    expect((await preview()).changes).toEqual([]);
    expect(await db.retreatInventoryPool.count({ where: { retreatDateId: dateId } })).toBe(1);
    expect(await db.retreatRoomUnit.count({ where: { retreatDateId: dateId } })).toBe(1);
  });
  it("rejects stale previews and applies category renames without changing prices", async () => {
    const plan = await preview();
    await db.retreatVenueRoomGroup.update({
      where: { id: groupId },
      data: { name: "King — Private bathroom", description: "Private bathroom along the corridor" },
    });
    await expect(
      applyVenueRoomSync({
        contentfulVenueId: key,
        dateId,
        revision: plan.revision,
        prices: {},
        actorUserId,
      })
    ).rejects.toThrow("VENUE_SYNC_STALE");
    await apply();
    const option = await db.retreatRoomOption.findFirstOrThrow({
      where: { retreatDateId: dateId },
      include: { ratePlans: true },
    });
    expect(option.label).toBe("King — Private bathroom — Private room");
    expect(option.ratePlans.map((rate) => rate.totalPricePence).sort()).toEqual([42500, 85000]);
  });
  it("adds a fourth category without rebuilding the original room", async () => {
    const original = await db.retreatRoomUnit.findFirstOrThrow({
      where: { retreatDateId: dateId },
    });
    for (const name of ["Twin", "King or twin", "Single"])
      await db.retreatVenueRoomGroup.create({
        data: {
          venueProfileId: venueId,
          name,
          quantity: 1,
          capacityPerRoom: 2,
          bedSetup: "fixed_twin",
          allowShared: true,
          privateGuestCountsJson: [1, 2],
          roomTemplates: { create: { label: name } },
        },
      });
    const plan = await preview();
    expect(plan.prices).toHaveLength(9);
    await apply();
    expect(await db.retreatInventoryPool.count({ where: { retreatDateId: dateId } })).toBe(4);
    expect(await db.retreatRoomUnit.findUnique({ where: { id: original.id } })).not.toBeNull();
    expect((await preview()).changes).toEqual([]);
  });
  it("preserves a paid booking and its allocation when descriptions change", async () => {
    const unit = await db.retreatRoomUnit.findFirstOrThrow({
      where: { retreatDateId: dateId, label: "Green" },
    });
    const booking = await db.retreatBooking.create({
      data: {
        retreatDateId: dateId,
        roomOptionId: unit.roomOptionId,
        roomUnitId: unit.id,
        purchaserFirstName: "Test",
        purchaserLastName: "Purchaser",
        purchaserEmail: `${key}@example.test`,
        attendeeFirstName: "Test",
        attendeeLastName: "Attendee",
        attendeeEmail: `${key}-attendee@example.test`,
        phone: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        totalPricePence: 42500,
        depositAmountPence: 10625,
        depositPaidPence: 10625,
        balanceAmountPence: 31875,
        bookingStatus: "deposit_paid",
        paymentStatus: "deposit_paid",
      },
    });
    await db.retreatVenueRoomGroup.update({
      where: { id: groupId },
      data: { description: "Updated bathroom description" },
    });
    await apply();
    const saved = await db.retreatBooking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(saved).toMatchObject({
      totalPricePence: 42500,
      depositAmountPence: 10625,
      depositPaidPence: 10625,
      balanceAmountPence: 31875,
      roomUnitId: unit.id,
    });
    expect(await db.retreatRoomUnit.findUnique({ where: { id: unit.id } })).not.toBeNull();
  });
  it("blocks physical changes affecting assigned rooms and leaves the database unchanged", async () => {
    const unit = await db.retreatRoomUnit.findFirstOrThrow({
      where: { retreatDateId: dateId, label: "Green" },
    });
    await db.retreatRoomUnit.update({ where: { id: unit.id }, data: { status: "assigned" } });
    await db.retreatVenueRoomGroup.update({ where: { id: groupId }, data: { quantity: 2 } });
    expect((await preview()).conflicts.join(" ")).toContain("assignments");
    await expect(apply()).rejects.toThrow("VENUE_SYNC_CONFLICT");
    expect(
      (await db.retreatInventoryPool.findUniqueOrThrow({ where: { id: unit.inventoryPoolId! } }))
        .totalQuantity
    ).toBe(2);
  });
});
