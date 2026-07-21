import { describe, expect, it } from "vitest";
import { retreats } from "@/data/retreat-data";

function getRetreat(slug: string) {
  const retreat = retreats.find((candidate) => candidate.slug === slug);
  expect(retreat, `Missing retreat seed: ${slug}`).toBeDefined();
  return retreat!;
}

function getRoomOption(retreatSlug: string, optionSlug: string) {
  const retreat = getRetreat(retreatSlug);
  const option = retreat.dates[0]?.roomOptions.find((candidate) => candidate.slug === optionSlug);
  expect(option, `Missing room option seed: ${retreatSlug}/${optionSlug}`).toBeDefined();
  return option!;
}

describe("retreat seed contract", () => {
  it("contains only the three supported sample experiences", () => {
    expect(retreats.map((retreat) => retreat.slug)).toEqual([
      "pause-move-breathe-stirling",
      "wild-ground-highland-perthshire",
      "sankalpa-online-workshop",
    ]);
  });

  it("models Stirling bed spaces and guest-count-dependent king-room rates", () => {
    const retreat = getRetreat("pause-move-breathe-stirling");
    const date = retreat.dates[0]!;
    const sharedTwin = getRoomOption(retreat.slug, "shared-twin-bed");
    const king = getRoomOption(retreat.slug, "private-king-room");

    expect(date).toMatchObject({
      totalSpaces: 10,
      depositType: "percentage",
      depositPercentageBasisPoints: 2000,
      balanceDueDaysBeforeStart: 56,
    });
    expect(sharedTwin).toMatchObject({
      bookingUnit: "bed_space",
      inventoryQuantity: 6,
      physicalRoomCount: 3,
      bedsPerPhysicalRoom: 2,
      guestCountPerUnit: 1,
      ratePlans: [
        {
          guestCount: 1,
          totalPricePence: 42500,
          earlyBirdPricePence: 39500,
        },
      ],
    });
    expect(king).toMatchObject({
      bookingUnit: "whole_room",
      inventoryQuantity: 2,
      allowedGuestCounts: [1, 2],
    });
    expect(king.ratePlans).toMatchObject([
      { guestCount: 1, totalPricePence: 52500, earlyBirdPricePence: 49500 },
      { guestCount: 2, totalPricePence: 91000, earlyBirdPricePence: 86000 },
    ]);
    expect(retreat.schedule.map((day) => day.title)).toEqual([
      "Arrive and Exhale",
      "Move, Explore and Restore",
      "Reflect and Return",
    ]);
  });

  it("models Wild Ground's three accommodation products and four-day schedule", () => {
    const retreat = getRetreat("wild-ground-highland-perthshire");
    const date = retreat.dates[0]!;

    expect(date).toMatchObject({
      totalSpaces: 10,
      depositType: "percentage",
      depositPercentageBasisPoints: 2500,
      balanceDueDaysBeforeStart: 70,
    });
    expect(getRoomOption(retreat.slug, "private-ensuite-room")).toMatchObject({
      inventoryQuantity: 4,
      allowedGuestCounts: [1],
      ratePlans: [{ guestCount: 1, totalPricePence: 72500, earlyBirdPricePence: 68500 }],
    });
    expect(getRoomOption(retreat.slug, "king-room-for-two")).toMatchObject({
      inventoryQuantity: 1,
      allowedGuestCounts: [2],
      ratePlans: [{ guestCount: 2, totalPricePence: 115000, earlyBirdPricePence: 109500 }],
    });
    expect(getRoomOption(retreat.slug, "shared-twin-bed")).toMatchObject({
      bookingUnit: "bed_space",
      inventoryQuantity: 4,
      physicalRoomCount: 2,
      bedsPerPhysicalRoom: 2,
      ratePlans: [{ guestCount: 1, totalPricePence: 62500, earlyBirdPricePence: 59000 }],
    });
    expect(retreat.schedule.map((day) => day.title)).toEqual([
      "Land",
      "Ground",
      "Explore",
      "Return",
    ]);
  });

  it("models Sankalpa as a full-payment live workshop with seven-day replay access", () => {
    const retreat = getRetreat("sankalpa-online-workshop");
    const date = retreat.dates[0]!;
    const ticket = getRoomOption(retreat.slug, "live-workshop-ticket");

    expect(retreat).toMatchObject({
      experienceType: "online_workshop",
      deliveryMode: "online_live",
      durationLabel: "2 hours",
    });
    expect(date).toMatchObject({
      retreatType: "online",
      totalSpaces: 30,
      depositType: "full_payment",
      replayAccessDurationDays: 7,
    });
    expect(ticket).toMatchObject({
      bookingUnit: "online_live_place",
      inventoryQuantity: 30,
      ratePlans: [{ guestCount: 1, totalPricePence: 2900, earlyBirdPricePence: 2500 }],
    });
    expect(retreat.schedule[0]?.items).toHaveLength(7);
    expect(retreat.whatToBring).toEqual([
      "yoga mat or comfortable floor space",
      "blanket",
      "pillow or cushion",
      "notebook or journal",
      "pen",
      "somewhere comfortable to lie down",
    ]);
  });
});
