import { describe, expect, it } from "vitest";
import type { RetreatCombinedContent, RetreatRoomOptionContent } from "@/lib/content/types";
import {
  getRetreatPriceSummary,
  getRetreatRoomOptionPriceSummary,
} from "@/lib/retreats/presentation";

function roomOption(overrides: Partial<RetreatRoomOptionContent> = {}): RetreatRoomOptionContent {
  return {
    id: "ticket",
    label: "Ticket",
    description: "One place",
    type: "virtual",
    guestsIncluded: 1,
    capacity: 20,
    availableSpots: 20,
    normalPricePence: 3500,
    ratePlans: [{ guestCount: 1, totalPricePence: 3500 }],
    ...overrides,
  };
}

function retreatPricing(
  roomOptions: RetreatRoomOptionContent[],
  normalPrice = 35
): Pick<RetreatCombinedContent, "dates" | "normalPrice"> {
  return {
    normalPrice,
    dates: [
      {
        id: "date-1",
        startDate: "2026-10-04T08:30:00.000Z",
        endDate: "2026-10-04T11:00:00.000Z",
        availableSpaces: 20,
        totalSpaces: 20,
        roomOptions,
        addons: [],
      },
    ],
  };
}

describe("retreat price presentation", () => {
  it("uses an exact price for a single ticket at one rate", () => {
    expect(getRetreatPriceSummary(retreatPricing([roomOption()]))).toEqual({
      lowestPricePence: 3500,
      isFromPrice: false,
    });
  });

  it("marks accommodation with distinct rates as a from price", () => {
    const accommodation = roomOption({
      id: "private-room",
      type: "single",
      normalPricePence: 55000,
      ratePlans: [
        { guestCount: 1, totalPricePence: 42500 },
        { guestCount: 2, totalPricePence: 55000 },
      ],
    });

    expect(getRetreatRoomOptionPriceSummary(accommodation)).toEqual({
      lowestPricePence: 42500,
      isFromPrice: true,
    });
    expect(getRetreatPriceSummary(retreatPricing([accommodation], 425))).toEqual({
      lowestPricePence: 42500,
      isFromPrice: true,
    });
  });

  it("uses an active early-bird rate when calculating the displayed minimum", () => {
    const accommodation = roomOption({
      normalPricePence: 50000,
      ratePlans: [
        {
          guestCount: 1,
          totalPricePence: 50000,
          earlyBirdPricePence: 42500,
          earlyBirdEndsAt: "2026-09-01T00:00:00.000Z",
        },
      ],
    });

    expect(
      getRetreatRoomOptionPriceSummary(accommodation, new Date("2026-08-20T00:00:00.000Z"))
    ).toEqual({
      lowestPricePence: 42500,
      isFromPrice: false,
    });
  });

  it("falls back to the retreat price when no booking options exist", () => {
    expect(getRetreatPriceSummary(retreatPricing([], 425))).toEqual({
      lowestPricePence: 42500,
      isFromPrice: false,
    });
  });
});
