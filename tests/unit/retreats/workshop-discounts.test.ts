import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ find: vi.fn(), update: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { retreatDate: { findUniqueOrThrow: mocks.find, update: mocks.update } },
}));
vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({ products: { create: mocks.create } }),
}));
import { workshopStripeProduct } from "@/lib/retreats/workshop-discounts";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.find.mockResolvedValue({
    id: "date",
    eventKind: "online_workshop",
    retreatTitleSnapshot: "Workshop",
    stripeWorkshopProductId: null,
  });
  mocks.create.mockResolvedValue({ id: "prod" });
});
it("creates and saves a product for an existing workshop", async () => {
  expect(await workshopStripeProduct("date")).toBe("prod");
  expect(mocks.create).toHaveBeenCalledWith(
    expect.objectContaining({ metadata: { workshopDateId: "date" } }),
    { idempotencyKey: "workshop-product:date" }
  );
  expect(mocks.update).toHaveBeenCalledWith({
    where: { id: "date" },
    data: { stripeWorkshopProductId: "prod" },
  });
});
it("reuses an existing product", async () => {
  mocks.find.mockResolvedValue({
    eventKind: "in_person_workshop",
    stripeWorkshopProductId: "existing",
  });
  expect(await workshopStripeProduct("date")).toBe("existing");
  expect(mocks.create).not.toHaveBeenCalled();
});
it("does not enable residential retreat discounts", async () => {
  mocks.find.mockResolvedValue({ eventKind: "residential_retreat" });
  await expect(workshopStripeProduct("date")).rejects.toThrow("WORKSHOP_DISCOUNT_INVALID");
});
