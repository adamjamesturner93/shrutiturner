import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({ db: {} }));

vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: vi.fn(),
}));

const { monthlyRecurringValuePence } =
  await import("@/lib/billing/coaching-subscription-projection");

describe("monthlyRecurringValuePence", () => {
  it("keeps monthly coaching subscriptions at their monthly value", () => {
    expect(
      monthlyRecurringValuePence({
        unitAmountPence: 15_000,
        quantity: 2,
        interval: "month",
        intervalCount: 1,
      })
    ).toBe(30_000);
  });

  it("normalises annual coaching subscriptions to a monthly value", () => {
    expect(
      monthlyRecurringValuePence({
        unitAmountPence: 120_000,
        quantity: 1,
        interval: "year",
        intervalCount: 1,
      })
    ).toBe(10_000);
  });
});
