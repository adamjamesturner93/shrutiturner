import { describe, expect, it } from "vitest";
import type { RetreatCombinedContent, RetreatRoomOptionContent } from "@/lib/content/types";
import {
  formatRetreatDateTimeRange,
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

describe("retreat date and time presentation", () => {
  it("formats a one-day retreat with both times and one date", () => {
    expect(
      formatRetreatDateTimeRange(
        "2027-10-05T07:30:00.000Z",
        "2027-10-05T11:00:00.000Z",
        "Europe/London"
      )
    ).toBe("08:30-12:00 5th October 2027");
  });

  it("formats a multi-day retreat in the same month without repeating the month or year", () => {
    expect(
      formatRetreatDateTimeRange(
        "2027-10-04T07:30:00.000Z",
        "2027-10-06T17:00:00.000Z",
        "Europe/London"
      )
    ).toBe("08:30 4th - 18:00 6th October 2027");
  });

  it("keeps cross-month and cross-year ranges unambiguous", () => {
    expect(
      formatRetreatDateTimeRange(
        "2027-09-30T07:30:00.000Z",
        "2027-10-02T17:00:00.000Z",
        "Europe/London"
      )
    ).toBe("08:30 30th September - 18:00 2nd October 2027");
    expect(
      formatRetreatDateTimeRange(
        "2027-12-31T08:30:00.000Z",
        "2028-01-02T18:00:00.000Z",
        "Europe/London"
      )
    ).toBe("08:30 31st December 2027 - 18:00 2nd January 2028");
  });

  it("uses the retreat timezone when the local date differs from UTC", () => {
    expect(
      formatRetreatDateTimeRange(
        "2027-07-01T23:30:00.000Z",
        "2027-07-02T01:00:00.000Z",
        "Europe/London"
      )
    ).toBe("00:30-02:00 2nd July 2027");
  });

  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
    [23, "23rd"],
  ])("uses the correct ordinal suffix for day %i", (day, ordinal) => {
    const isoDay = String(day).padStart(2, "0");
    expect(
      formatRetreatDateTimeRange(
        `2027-10-${isoDay}T08:30:00.000Z`,
        `2027-10-${isoDay}T11:00:00.000Z`,
        "UTC"
      )
    ).toBe(`08:30-11:00 ${ordinal} October 2027`);
  });
});
