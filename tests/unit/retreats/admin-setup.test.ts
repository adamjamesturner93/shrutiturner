import { beforeEach, describe, expect, it, vi } from "vitest";
const db = {
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
  retreatDate: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  retreatInventoryPool: { create: vi.fn() },
  retreatRoomOption: { create: vi.fn(), update: vi.fn() },
  retreatRatePlan: { create: vi.fn(), update: vi.fn() },
  retreatDepositRule: { create: vi.fn() },
  retreatBookingInstalment: { update: vi.fn() },
};
const send = vi.fn();
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/postmark/client", () => ({ sendPostmarkReactEmail: send }));
const { createAdminRetreatDate, updateAdminRetreatTicketPrices, sendRetreatBalanceDueEmails } =
  await import("@/lib/retreats/service");
beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation((callback: (tx: typeof db) => Promise<unknown>) =>
    callback(db)
  );
  db.retreatDate.create.mockResolvedValue({ id: "new-date" });
  db.retreatInventoryPool.create.mockResolvedValue({ id: "pool" });
  db.retreatRoomOption.create.mockResolvedValue({ id: "ticket" });
  db.retreatDate.findUnique.mockResolvedValue({
    id: "date",
    status: "draft",
    retreatType: "online",
    roomOptions: [{ id: "ticket", ratePlans: [{ id: "rate", earlyBirdPricePence: 3000 }] }],
  });
});
describe("guided draft setup", () => {
  const input = {
    retreatSlug: "workshop",
    title: "Workshop",
    location: "Online",
    retreatType: "online" as const,
    startsAt: new Date("2030-10-01"),
    endsAt: new Date("2030-10-02"),
    capacity: 30,
    pricePence: 0,
    paymentPolicy: "full_payment" as const,
  };
  it("does not silently reuse another date, and starts as an unconfirmed private draft", async () => {
    await createAdminRetreatDate(input);
    expect(db.retreatDate.findFirst).not.toHaveBeenCalled();
    expect(db.retreatDate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "draft", pricePence: 0, capacity: 30 }),
      })
    );
    expect(db.retreatDate.create.mock.calls[0][0].data.accommodationConfiguredAt).toBeUndefined();
  });
  it("refuses a copy source from another experience", async () => {
    db.retreatDate.findFirst.mockResolvedValue(null);
    await expect(
      createAdminRetreatDate({ ...input, copyFromDateId: "wrong-date" })
    ).rejects.toThrow("RETREAT_TYPE_MISMATCH");
    expect(db.retreatDate.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "wrong-date", retreatSlug: "workshop" } })
    );
    expect(db.retreatDate.create).not.toHaveBeenCalled();
  });
  it("saves ticket prices and confirms setup, clearing invalid early-bird prices", async () => {
    await updateAdminRetreatTicketPrices("date", [{ id: "rate", pricePence: 2000 }]);
    expect(db.retreatRatePlan.update).toHaveBeenCalledWith({
      where: { id: "rate" },
      data: { totalPricePence: 2000, earlyBirdPricePence: null, earlyBirdEndsAt: null },
    });
    expect(db.retreatDate.update).toHaveBeenCalledWith({
      where: { id: "date" },
      data: {
        pricePence: 2000,
        depositAmountPence: 2000,
        accommodationConfiguredAt: expect.any(Date),
      },
    });
  });
  it.each(
    [
      [],
      [{ id: "foreign-rate", pricePence: 1000 }],
      [{ id: "rate", pricePence: -1 }],
      [{ id: "rate", pricePence: NaN }],
    ].map((rates) => ({ rates }))
  )("rejects incomplete or unsafe ticket prices", async ({ rates }) => {
    await expect(updateAdminRetreatTicketPrices("date", rates)).rejects.toThrow("INVALID_PRICE");
    expect(db.retreatRatePlan.update).not.toHaveBeenCalled();
  });
  it("locks published prices", async () => {
    db.retreatDate.findUnique.mockResolvedValue({ status: "open", retreatType: "online" });
    await expect(
      updateAdminRetreatTicketPrices("date", [{ id: "rate", pricePence: 3500 }])
    ).rejects.toThrow("RETREAT_PRICING_LOCKED");
  });
  it("previews payment recipients without sending or changing reminder history", async () => {
    db.retreatDate.findUnique.mockResolvedValue({
      bookings: [
        {
          id: "booking",
          paymentStatus: "deposit_paid",
          bookingStatus: "deposit_paid",
          balanceAmountPence: 72800,
          balancePaymentUrlToken: "secret-link",
          purchaserFirstName: "Sam",
          purchaserLastName: "Lee",
          purchaserEmail: "sam@example.com",
          instalments: [],
        },
      ],
    });
    const preview = await sendRetreatBalanceDueEmails({ retreatDateId: "date", preview: true });
    expect(preview.recipients).toEqual([
      { bookingId: "booking", name: "Sam Lee", email: "sam@example.com", amountPence: 72800 },
    ]);
    expect(JSON.stringify(preview)).not.toContain("secret-link");
    expect(send).not.toHaveBeenCalled();
    expect(db.retreatBookingInstalment.update).not.toHaveBeenCalled();
  });
});
