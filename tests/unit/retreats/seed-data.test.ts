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
  it("contains only The Middle Ground online workshop", () => {
    expect(retreats.map((retreat) => retreat.slug)).toEqual(["the-middle-ground"]);
  });

  it("models The Middle Ground as a £35 full-payment online workshop", () => {
    const retreat = getRetreat("the-middle-ground");
    const date = retreat.dates[0]!;
    const ticket = getRoomOption(retreat.slug, "live-workshop-ticket");

    expect(retreat).toMatchObject({
      title: "The Middle Ground",
      subtitle: "Movement, motivation and working with your body this autumn",
      experienceType: "online_workshop",
      deliveryMode: "online_live",
      durationLabel: "2.5-hour online workshop",
      normalPrice: 35,
      accommodation: "",
      foodAndDrinkDescription: "",
      notIncluded: [],
    });
    expect(date).toMatchObject({
      retreatType: "online",
      totalSpaces: 30,
      depositType: "full_payment",
      fixedDepositAmountPence: 3500,
      payInFullDiscountEnabled: false,
      startDateTime: "2026-10-04T09:30:00.000+01:00",
      endDateTime: "2026-10-04T12:00:00.000+01:00",
    });
    expect(ticket).toMatchObject({
      bookingUnit: "online_live_place",
      inventoryQuantity: 30,
      ratePlans: [{ guestCount: 1, totalPricePence: 3500 }],
    });
    expect(retreat.schedule[0]?.items).toHaveLength(6);
    expect(retreat.whatToBring).toEqual([
      "Comfortable clothes",
      "Space to move in",
      "A notebook or journal",
      "A pen",
    ]);
  });
});
