import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ retrieve: vi.fn(), lines: vi.fn(), promo: vi.fn() }));
vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({
    checkout: { sessions: { retrieve: mocks.retrieve, listLineItems: mocks.lines } },
    promotionCodes: { retrieve: mocks.promo },
  }),
}));
import { getWorkshopPayment } from "@/lib/retreats/workshop-payment";
const input = {
  sessionId: "cs",
  expectedSessionId: "cs",
  reference: { bookingId: "booking" },
  currency: "GBP",
  productId: "prod",
  originalTotalPence: 4500,
  items: [
    { id: "ticket", originalPence: 3500 },
    { id: "extra", addonId: "addon", originalPence: 1000 },
  ],
};
const session = (discount = 700) => ({
  id: "cs",
  metadata: { bookingId: "booking", workshopDiscountVersion: "2" },
  currency: "gbp",
  status: "complete",
  payment_status: discount === 4500 ? "no_payment_required" : "paid",
  amount_subtotal: 4500,
  amount_total: 4500 - discount,
  total_details: { amount_discount: discount },
  discounts: discount ? [{ promotion_code: { id: "promo", code: "SAVE" } }] : [],
});
const line = (id: string, subtotal: number, discount: number, addonId?: string) => ({
  price: { product: { id, metadata: { addonId } } },
  quantity: 1,
  currency: "gbp",
  amount_subtotal: subtotal,
  amount_discount: discount,
  amount_tax: 0,
  amount_total: subtotal - discount,
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.retrieve.mockResolvedValue(session());
  mocks.lines.mockResolvedValue({
    has_more: false,
    data: [line("prod", 3500, 700), line("extra", 1000, 0, "addon")],
  });
});
it("records a ticket discount while leaving extras at full price", async () => {
  expect(await getWorkshopPayment(input)).toMatchObject({
    totalPence: 3800,
    promotionDiscountPence: 700,
    originalTotalPence: 4500,
    promotionCodeSnapshot: "SAVE",
    items: [
      { id: "ticket", totalPence: 2800 },
      { id: "extra", totalPence: 1000 },
    ],
  });
});
it.each([0, 500, 4500])(
  "records Stripe's final %i pence discount including free orders",
  async (discount) => {
    mocks.retrieve.mockResolvedValue(session(discount));
    mocks.lines.mockResolvedValue({
      has_more: false,
      data: [
        line("prod", 3500, Math.min(discount, 3500)),
        line("extra", 1000, Math.max(discount - 3500, 0), "addon"),
      ],
    });
    expect((await getWorkshopPayment(input)).totalPence).toBe(4500 - discount);
  }
);
it.each([
  { currency: "usd" },
  { amount_subtotal: 4400 },
  { amount_total: 3700 },
  { status: "open" },
  { payment_status: "unpaid" },
  { metadata: { bookingId: "other", workshopDiscountVersion: "2" } },
])("rejects mismatched or unpaid sessions", async (override) => {
  mocks.retrieve.mockResolvedValue({ ...session(), ...override });
  await expect(getWorkshopPayment(input)).rejects.toThrow("WORKSHOP_PAYMENT_MISMATCH");
});
it("rejects a different session before calling Stripe", async () => {
  await expect(getWorkshopPayment({ ...input, expectedSessionId: "other" })).rejects.toThrow();
  expect(mocks.retrieve).not.toHaveBeenCalled();
});
it("rejects unexpected items even when totals match", async () => {
  mocks.lines.mockResolvedValue({
    has_more: false,
    data: [line("wrong", 3500, 700), line("extra", 1000, 0, "addon")],
  });
  await expect(getWorkshopPayment(input)).rejects.toThrow();
});
it("validates gifts against their purchase ID", async () => {
  mocks.retrieve.mockResolvedValue({
    ...session(),
    metadata: { giftPurchaseId: "gift", workshopDiscountVersion: "2" },
  });
  expect(
    (await getWorkshopPayment({ ...input, reference: { giftPurchaseId: "gift" } })).totalPence
  ).toBe(3800);
});
