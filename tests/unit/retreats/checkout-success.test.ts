import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ retrieve: vi.fn(), booking: vi.fn(), gift: vi.fn() }));
vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({ checkout: { sessions: { retrieve: mocks.retrieve } } }),
}));
vi.mock("@/lib/db", () => ({
  db: { retreatBooking: { findUnique: mocks.booking }, giftPurchase: { findUnique: mocks.gift } },
}));
import { getRetreatCheckoutSuccessState } from "@/lib/retreats/checkout-success";
const date = {
  retreatTitleSnapshot: "Weekend",
  retreatType: "in_person",
  startsAt: new Date("2027-06-11"),
  endsAt: new Date("2027-06-13"),
  timezone: "Europe/London",
};
beforeEach(() => {
  mocks.retrieve.mockResolvedValue({
    id: "cs_test",
    status: "complete",
    payment_status: "paid",
    amount_total: 22500,
    metadata: { kind: "retreat_instalment", bookingId: "booking" },
  });
  mocks.booking.mockResolvedValue({
    id: "booking",
    retreatDate: date,
    stripeDepositSessionId: "cs_test",
    purchaserFirstName: "Test",
    purchaserEmail: "test@example.com",
    attendeeCount: 2,
    currency: "GBP",
    balanceAmountPence: 67500,
    balancePaidPence: 0,
    balanceDueAt: new Date("2027-04-16"),
    roomOptionLabelSnapshot: "Private room",
  });
});
it("summarises two-person deposits and the balance date without attendee health data", async () => {
  expect(await getRetreatCheckoutSuccessState("cs_test")).toMatchObject({
    guestCount: 2,
    paidNowPence: 22500,
    balancePence: 67500,
    balanceDueAt: "2027-04-16T00:00:00.000Z",
    paymentComplete: true,
  });
});
it("does not describe an unpaid completed session as payment received", async () => {
  mocks.retrieve.mockResolvedValue({
    id: "cs_test",
    status: "complete",
    payment_status: "unpaid",
    metadata: { kind: "retreat_instalment", bookingId: "booking" },
  });
  expect((await getRetreatCheckoutSuccessState("cs_test")).paymentComplete).toBe(false);
});
it("recognises a completed free order", async () => {
  mocks.retrieve.mockResolvedValue({
    id: "cs_test",
    status: "complete",
    payment_status: "no_payment_required",
    amount_total: 0,
    metadata: { kind: "retreat_gift", giftPurchaseId: "gift" },
  });
  mocks.gift.mockResolvedValue({
    retreatDate: date,
    stripeCheckoutSessionId: "cs_test",
    retreatGuestCount: 1,
    currency: "GBP",
    totalPaidPence: 3500,
    deliveryTarget: "purchaser",
  });
  expect(await getRetreatCheckoutSuccessState("cs_test")).toMatchObject({
    paidNowPence: 0,
    balancePence: 0,
    paymentComplete: true,
    deliveryTarget: "purchaser",
  });
});
it("rejects a checkout session that does not belong to the booking", async () => {
  mocks.booking.mockResolvedValue({ stripeDepositSessionId: "cs_other" });
  await expect(getRetreatCheckoutSuccessState("cs_test")).rejects.toThrow("INVALID_SESSION");
});
