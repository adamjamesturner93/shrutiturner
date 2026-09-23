import { describe, expect, it } from "vitest";
import {
  getRoomPriceDeposit,
  quoteRetreatAccommodation,
  resolveRetreatDepositRule,
} from "@/lib/retreats/pricing";

describe("authoritative room deposit display", () => {
  it.each([42500, 52500, 91000, 10001])(
    "uses 25%% of the selected price %i despite an old common deposit",
    (price) => {
      const depositRule = resolveRetreatDepositRule(
        { depositType: "percentage", depositPercentageBasisPoints: 2500 },
        { normalPricePence: price, depositPence: 10000 }
      );
      const display = getRoomPriceDeposit(
        { normalPricePence: price, depositPence: 10000, depositRule },
        price
      );
      const quote = quoteRetreatAccommodation({
        bookingUnit: "whole_room",
        quantity: 1,
        guestCount: 2,
        ratePlans: [{ guestCount: 2, totalPricePence: price }],
        depositRule,
      });
      expect(display).toBe(Math.round(price / 4));
      expect(display).toBe(quote.depositPence);
      expect(quote.balancePence + display).toBe(price);
    }
  );
  it("uses effective early-bird price and does not scale a fixed deposit by occupancy", () => {
    expect(
      getRoomPriceDeposit(
        {
          normalPricePence: 60000,
          depositRule: { depositType: "percentage", depositPercentageBasisPoints: 2500 },
        },
        50000
      )
    ).toBe(12500);
    expect(
      getRoomPriceDeposit(
        {
          normalPricePence: 60000,
          depositRule: { depositType: "fixed_amount", fixedDepositAmountPence: 10000 },
        },
        110000
      )
    ).toBe(10000);
    expect(
      getRoomPriceDeposit(
        { normalPricePence: 60000, depositRule: { depositType: "full_payment" } },
        50000
      )
    ).toBe(50000);
  });
  it("rejects malformed configured rules rather than silently charging a legacy amount", () => {
    expect(() =>
      resolveRetreatDepositRule(
        { depositType: "percentage", depositPercentageBasisPoints: null },
        { normalPricePence: 50000, depositPence: 10000 }
      )
    ).toThrow("INVALID_RETREAT_PAYMENT_RULE");
  });
});
