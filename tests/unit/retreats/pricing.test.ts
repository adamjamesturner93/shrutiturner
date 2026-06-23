import { describe, expect, it } from "vitest";
import {
  buildRetreatInstalmentPlan,
  calculateOnlineNonRefundableAmount,
  calculatePayInFullDiscount,
  calculateRetreatNonRefundableAmount,
  calculateRetreatRefund,
} from "@/lib/retreats/pricing";

describe("retreat pricing", () => {
  it("caps pay-in-full discount at the lower of 5 percent or 50 pounds", () => {
    expect(calculatePayInFullDiscount(42500, true)).toBe(2125);
    expect(calculatePayInFullDiscount(200000, true)).toBe(5000);
    expect(calculatePayInFullDiscount(200000, false)).toBe(0);
  });

  it("uses the greater of 10 pounds or 10 percent for online non-refundable amounts", () => {
    expect(calculateOnlineNonRefundableAmount(5000)).toBe(1000);
    expect(calculateOnlineNonRefundableAmount(42500)).toBe(4250);
  });

  it("uses deposit-equivalent as the non-refundable amount for in-person retreats", () => {
    expect(
      calculateRetreatNonRefundableAmount({
        retreatType: "in_person",
        totalPence: 42500,
        depositPence: 10000,
      })
    ).toBe(10000);
  });

  it("allocates percentage payment plans and rounds the final instalment to the total", () => {
    const plan = buildRetreatInstalmentPlan({
      totalPence: 42500,
      depositPence: 10000,
      startsAt: new Date("2026-09-01T00:00:00.000Z"),
      paymentPlan: {
        instalments: [
          { label: "Deposit", kind: "deposit", percent: 25 },
          { label: "Balance", kind: "balance", percent: 75, dueDaysBeforeStart: 56 },
        ],
      },
    });

    expect(plan).toMatchObject([
      { sequence: 1, kind: "deposit", amountPence: 10625 },
      { sequence: 2, kind: "balance", amountPence: 31875 },
    ]);
    expect("dueAt" in plan[1]).toBe(true);
    expect(plan[1] && "dueAt" in plan[1] ? plan[1].dueAt?.toISOString() : null).toBe(
      "2026-07-07T00:00:00.000Z"
    );
  });

  it("refunds paid amount above the deposit before the in-person cutoff only", () => {
    const startsAt = new Date("2026-09-01T00:00:00.000Z");
    expect(
      calculateRetreatRefund({
        actualPaidPence: 42500,
        nonRefundableAmountPence: 10000,
        startsAt,
        requestedAt: new Date("2026-06-01T00:00:00.000Z"),
        retreatType: "in_person",
      })
    ).toBe(32500);

    expect(
      calculateRetreatRefund({
        actualPaidPence: 42500,
        nonRefundableAmountPence: 10000,
        startsAt,
        requestedAt: new Date("2026-08-01T00:00:00.000Z"),
        retreatType: "in_person",
      })
    ).toBe(0);
  });

  it("uses a shorter online retreat refund cutoff", () => {
    const startsAt = new Date("2026-09-01T00:00:00.000Z");
    expect(
      calculateRetreatRefund({
        actualPaidPence: 5000,
        nonRefundableAmountPence: 1000,
        startsAt,
        requestedAt: new Date("2026-08-01T00:00:00.000Z"),
        retreatType: "online",
      })
    ).toBe(4000);
  });
});
