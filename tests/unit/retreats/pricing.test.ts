import { describe, expect, it } from "vitest";
import {
  buildRetreatInstalmentPlan,
  canExtendPublishedEarlyBirdRate,
  calculateDepositFromRule,
  calculateOnlineNonRefundableAmount,
  calculatePayInFullDiscount,
  calculatePercentageDeposit,
  calculateRetreatNonRefundableAmount,
  calculateRetreatRefund,
  getEffectiveRetreatRatePricePence,
  getInventoryUnitsConsumed,
  getRemainingInventory,
  getRetreatOptionAvailability,
  isRetreatEarlyBirdActive,
  quoteRetreatAccommodation,
} from "@/lib/retreats/pricing";

describe("retreat pricing", () => {
  it("shares convertible inventory between king and single-bed configurations", () => {
    expect(
      getRetreatOptionAvailability({
        optionCapacity: 1,
        reservedOptionBookings: 0,
        poolTotalUnits: 2,
        reservedPoolUnits: 1,
        inventoryUnitsPerBooking: 2,
      })
    ).toBe(0);
    expect(
      getRetreatOptionAvailability({
        optionCapacity: 2,
        reservedOptionBookings: 1,
        poolTotalUnits: 2,
        reservedPoolUnits: 1,
        inventoryUnitsPerBooking: 1,
      })
    ).toBe(1);
    expect(
      getRetreatOptionAvailability({
        optionCapacity: 2,
        reservedOptionBookings: 0,
        poolTotalUnits: 2,
        reservedPoolUnits: 2,
        inventoryUnitsPerBooking: 1,
      })
    ).toBe(0);
  });

  it("calculates seeded Stirling retreat deposits from percentages", () => {
    expect(calculatePercentageDeposit(42500, 2000)).toBe(8500);
    expect(calculatePercentageDeposit(52500, 2000)).toBe(10500);
    expect(calculatePercentageDeposit(91000, 2000)).toBe(18200);
  });

  it("uses integer-safe percentage deposits", () => {
    expect(calculatePercentageDeposit(9999, 3333)).toBe(3333);
    expect(
      calculateDepositFromRule(10001, {
        depositType: "percentage",
        depositPercentageBasisPoints: 2500,
      })
    ).toBe(2500);
  });

  it("requires the full authoritative price when deposits are disabled", () => {
    const quote = quoteRetreatAccommodation({
      bookingUnit: "online_live_place",
      quantity: 1,
      guestCount: 1,
      guestCountPerUnit: 1,
      ratePlans: [{ id: "online-ticket", guestCount: 1, totalPricePence: 2900 }],
      depositRule: { depositType: "full_payment" },
    });

    expect(quote).toMatchObject({
      totalPricePence: 2900,
      depositPence: 2900,
      balancePence: 0,
    });
    expect(calculatePayInFullDiscount(quote.totalPricePence, false)).toBe(0);
  });

  it("only allows an existing published early-bird deadline to be extended", () => {
    const existingEndsAt = new Date("2026-08-01T23:00:00.000Z");
    const retreatStartsAt = new Date("2026-09-18T15:00:00.000Z");

    expect(
      canExtendPublishedEarlyBirdRate({
        existingPricePence: 39500,
        existingEndsAt,
        submittedPricePence: 39500,
        submittedEndsAt: new Date("2026-08-14T23:00:00.000Z"),
        retreatStartsAt,
      })
    ).toBe(true);
    expect(
      canExtendPublishedEarlyBirdRate({
        existingPricePence: 39500,
        existingEndsAt,
        submittedPricePence: 39000,
        submittedEndsAt: new Date("2026-08-14T23:00:00.000Z"),
        retreatStartsAt,
      })
    ).toBe(false);
    expect(
      canExtendPublishedEarlyBirdRate({
        existingPricePence: 39500,
        existingEndsAt,
        submittedPricePence: 39500,
        submittedEndsAt: new Date("2026-07-31T23:00:00.000Z"),
        retreatStartsAt,
      })
    ).toBe(false);
    expect(
      canExtendPublishedEarlyBirdRate({
        existingPricePence: null,
        existingEndsAt: null,
        submittedPricePence: 39500,
        submittedEndsAt: new Date("2026-08-14T23:00:00.000Z"),
        retreatStartsAt,
      })
    ).toBe(false);
  });

  it("quotes shared bed spaces as one guest and one inventory unit per quantity", () => {
    const quote = quoteRetreatAccommodation({
      bookingUnit: "bed_space",
      quantity: 2,
      guestCount: 1,
      guestCountPerUnit: 1,
      ratePlans: [{ id: "shared-twin", guestCount: 1, totalPricePence: 42500 }],
      depositRule: { depositType: "percentage", depositPercentageBasisPoints: 2000 },
    });

    expect(quote).toMatchObject({
      ratePlanId: "shared-twin",
      inventoryUnitsConsumed: 2,
      totalGuestCount: 2,
      totalPricePence: 85000,
      depositPence: 17000,
      balancePence: 68000,
    });
  });

  it("quotes Stirling king rooms by selected guest count while consuming one room", () => {
    const base = {
      bookingUnit: "whole_room" as const,
      quantity: 1,
      allowedGuestCounts: [1, 2],
      ratePlans: [
        { id: "king-one", guestCount: 1, totalPricePence: 52500 },
        { id: "king-two", guestCount: 2, totalPricePence: 91000 },
      ],
      depositRule: { depositType: "percentage" as const, depositPercentageBasisPoints: 2000 },
    };

    expect(quoteRetreatAccommodation({ ...base, guestCount: 1 })).toMatchObject({
      ratePlanId: "king-one",
      inventoryUnitsConsumed: 1,
      totalGuestCount: 1,
      depositPence: 10500,
    });
    expect(quoteRetreatAccommodation({ ...base, guestCount: 2 })).toMatchObject({
      ratePlanId: "king-two",
      inventoryUnitsConsumed: 1,
      totalGuestCount: 2,
      depositPence: 18200,
    });
  });

  it("can consume two shared base units for a convertible king booking", () => {
    const quote = quoteRetreatAccommodation({
      bookingUnit: "whole_room",
      quantity: 1,
      inventoryUnitsPerBooking: 2,
      guestCount: 2,
      allowedGuestCounts: [1, 2],
      ratePlans: [{ id: "king", guestCount: 2, totalPricePence: 91000 }],
      depositRule: { depositType: "percentage", depositPercentageBasisPoints: 2000 },
    });

    expect(quote.inventoryUnitsConsumed).toBe(2);
  });

  it("rejects guest counts not allowed by the rate plan", () => {
    expect(() =>
      quoteRetreatAccommodation({
        bookingUnit: "whole_room",
        quantity: 1,
        guestCount: 2,
        allowedGuestCounts: [1],
        ratePlans: [{ id: "wild-private", guestCount: 1, totalPricePence: 72500 }],
        depositRule: { depositType: "percentage", depositPercentageBasisPoints: 2500 },
      })
    ).toThrow("RETREAT_GUEST_COUNT_INVALID");

    expect(() =>
      quoteRetreatAccommodation({
        bookingUnit: "whole_room",
        quantity: 1,
        guestCount: 1,
        allowedGuestCounts: [2],
        ratePlans: [{ id: "wild-king-two", guestCount: 2, totalPricePence: 115000 }],
        depositRule: { depositType: "percentage", depositPercentageBasisPoints: 2500 },
      })
    ).toThrow("RETREAT_GUEST_COUNT_INVALID");
  });

  it("models remaining availability without consuming whole rooms for bed-space bookings", () => {
    expect(getRemainingInventory({ totalQuantity: 6, confirmedQuantity: 6, heldQuantity: 0 })).toBe(
      0
    );
    expect(getRemainingInventory({ totalQuantity: 6, confirmedQuantity: 7, heldQuantity: 0 })).toBe(
      0
    );
    expect(getInventoryUnitsConsumed({ bookingUnit: "bed_space", quantity: 1 })).toBe(1);
    expect(getInventoryUnitsConsumed({ bookingUnit: "whole_room", quantity: 1 })).toBe(1);
    expect(getRemainingInventory({ totalQuantity: 2, confirmedQuantity: 2, heldQuantity: 0 })).toBe(
      0
    );
  });

  it("returns server-authoritative totals rather than trusting submitted totals", () => {
    const quote = quoteRetreatAccommodation({
      bookingUnit: "whole_room",
      quantity: 1,
      guestCount: 2,
      allowedGuestCounts: [2],
      ratePlans: [{ id: "server-rate", guestCount: 2, totalPricePence: 91000 }],
      depositRule: { depositType: "percentage", depositPercentageBasisPoints: 2000 },
    });

    expect(quote.totalPricePence).toBe(91000);
  });

  it("uses early bird rate plans before the configured end date", () => {
    const now = new Date("2026-07-01T12:00:00.000Z");
    const ratePlan = {
      id: "early-shared",
      guestCount: 1,
      totalPricePence: 42500,
      earlyBirdPricePence: 39500,
      earlyBirdEndsAt: "2026-08-01T23:00:00.000Z",
    };

    expect(isRetreatEarlyBirdActive({ ...ratePlan, now })).toBe(true);
    expect(getEffectiveRetreatRatePricePence(ratePlan, now)).toBe(39500);
    expect(
      quoteRetreatAccommodation({
        bookingUnit: "bed_space",
        quantity: 1,
        guestCount: 1,
        guestCountPerUnit: 1,
        ratePlans: [ratePlan],
        depositRule: { depositType: "percentage", depositPercentageBasisPoints: 2000 },
        now,
      })
    ).toMatchObject({
      totalPricePence: 39500,
      depositPence: 7900,
    });
  });

  it("falls back to the standard rate after early bird ends", () => {
    const ratePlan = {
      id: "expired-early-shared",
      guestCount: 1,
      totalPricePence: 42500,
      earlyBirdPricePence: 39500,
      earlyBirdEndsAt: "2026-08-01T23:00:00.000Z",
    };

    expect(getEffectiveRetreatRatePricePence(ratePlan, new Date("2026-08-02T00:00:00.000Z"))).toBe(
      42500
    );
  });

  it("caps pay in full discount at the lower of 5% or GBP 50", () => {
    expect(calculatePayInFullDiscount(42500, true)).toBe(2125);
    expect(calculatePayInFullDiscount(200000, true)).toBe(5000);
    expect(calculatePayInFullDiscount(42500, false)).toBe(0);
  });

  it("uses the greater of GBP 10 or 10% as the online non-refundable amount", () => {
    expect(calculateOnlineNonRefundableAmount(5000)).toBe(1000);
    expect(calculateOnlineNonRefundableAmount(25000)).toBe(2500);
  });

  it("uses the configured deposit as the in-person non-refundable amount", () => {
    expect(
      calculateRetreatNonRefundableAmount({
        retreatType: "in_person",
        totalPence: 42500,
        depositPence: 15000,
      })
    ).toBe(15000);
  });

  it("builds default deposit and balance instalments", () => {
    const startsAt = new Date("2026-10-01T09:00:00.000Z");
    const instalments = buildRetreatInstalmentPlan({
      totalPence: 42500,
      depositPence: 15000,
      startsAt,
    });

    expect(instalments).toMatchObject([
      { sequence: 1, kind: "deposit", amountPence: 15000 },
      { sequence: 2, kind: "balance", amountPence: 27500 },
    ]);
    expect(instalments[1]?.dueAt?.toISOString()).toBe("2026-08-06T09:00:00.000Z");
  });

  it("allocates rounding remainder to the final configured instalment", () => {
    const instalments = buildRetreatInstalmentPlan({
      totalPence: 10001,
      depositPence: 0,
      startsAt: new Date("2026-10-01T09:00:00.000Z"),
      paymentPlan: {
        instalments: [
          { label: "First", kind: "deposit", percent: 33 },
          { label: "Second", kind: "scheduled", percent: 33 },
          { label: "Final", kind: "balance", percent: 34 },
        ],
      },
    });

    expect(instalments.map((instalment) => instalment.amountPence)).toEqual([3300, 3300, 3401]);
  });

  it("refunds paid amount minus non-refundable amount before the cutoff only", () => {
    const startsAt = new Date("2026-10-01T09:00:00.000Z");
    expect(
      calculateRetreatRefund({
        actualPaidPence: 42500,
        nonRefundableAmountPence: 15000,
        startsAt,
        requestedAt: new Date("2026-07-01T09:00:00.000Z"),
        retreatType: "in_person",
      })
    ).toBe(27500);
    expect(
      calculateRetreatRefund({
        actualPaidPence: 42500,
        nonRefundableAmountPence: 15000,
        startsAt,
        requestedAt: new Date("2026-09-01T09:00:00.000Z"),
        retreatType: "in_person",
      })
    ).toBe(0);
  });
});
