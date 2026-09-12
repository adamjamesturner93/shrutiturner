import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

const provider = vi.hoisted(() => ({ refund: vi.fn() }));
vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({
    invoices: {
      retrieve: async () => ({
        payments: {
          data: [
            { status: "paid", payment: { type: "payment_intent", payment_intent: "pi_fixture" } },
          ],
        },
      }),
    },
    refunds: { create: provider.refund },
  }),
}));
const { createMembershipRefund } = await import("@/lib/billing/refund-service");
const { issueMembershipRefund } = await import("@/lib/billing/subscription-compliance");
const fixtureId = `refund-safety-${randomUUID()}`;
let userId: string;
let membershipId: string;
const request = (key: string) => ({
  membershipId,
  actorUserId: userId,
  amountPence: 2000,
  reason: "Integration fixture",
  idempotencyKey: key,
  expectedInvoiceId: "in_fixture",
});

beforeAll(async () => {
  const target = new URL(process.env.DATABASE_URL!);
  if (!["127.0.0.1", "localhost"].includes(target.hostname))
    throw new Error("Local database required");
  const user = await db.user.create({
    data: { email: `${fixtureId}@example.com`, name: "Refund fixture" },
  });
  userId = user.id;
  const membership = await db.membershipSubscription.create({
    data: {
      userId,
      plan: "movewell",
      status: "active",
      pricePence: 3500,
      classesPerWeek: 1,
      latestInvoiceId: "in_fixture",
      latestInvoiceAmountPence: 3500,
    },
  });
  membershipId = membership.id;
});
beforeEach(async () => {
  await db.billingRefund.deleteMany({ where: { membershipId } });
  await db.creditLedgerEntry.deleteMany({ where: { userId } });
  provider.refund.mockImplementation(async (_params, options) => ({
    id: `re_${options.idempotencyKey}`,
    status: "succeeded",
  }));
});
afterAll(async () => {
  if (!userId) return;
  await db.adminActionLog.deleteMany({ where: { actorUserId: userId } });
  await db.user.delete({ where: { id: userId } });
  await db.$disconnect();
});

describe("membership refund reservations", () => {
  it("cooling-off retries share one reservation and cannot bypass a manual refund", async () => {
    await createMembershipRefund({ ...request(randomUUID()), amountPence: 1000 });
    const automatic = { membershipId, userId, amountPence: 3000, reason: "Cooling-off fixture" };
    const first = await issueMembershipRefund(automatic);
    const retry = await issueMembershipRefund({ ...automatic, amountPence: 2900 });
    expect(first.id).toBe(retry.id);
    expect(first.amountPence).toBe(2500);
    expect(provider.refund).toHaveBeenCalledTimes(2);
    expect((await db.billingRefund.aggregate({ where: { membershipId }, _sum: { amountPence: true } }))._sum.amountPence).toBe(3500);
  });
  it("serializes different requests so capacity cannot be over-refunded", async () => {
    const results = await Promise.allSettled([
      createMembershipRefund(request(randomUUID())),
      createMembershipRefund(request(randomUUID())),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await db.billingRefund.count({ where: { membershipId } })).toBe(1);
    expect(provider.refund).toHaveBeenCalledTimes(1);
  });
  it("concurrent retries use one reservation and the same Stripe identity", async () => {
    const input = request(randomUUID());
    const results = await Promise.all([
      createMembershipRefund(input),
      createMembershipRefund(input),
    ]);
    expect(results[0].id).toBe(results[1].id);
    expect(await db.billingRefund.count({ where: { membershipId } })).toBe(1);
    const keys = new Set(provider.refund.mock.calls.map((call) => call[1].idempotencyKey));
    expect(keys.size).toBe(1);
  });
  it("keeps timeout capacity reserved, rejects a new key, and recovers using the original", async () => {
    const input = request(randomUUID());
    provider.refund.mockRejectedValueOnce(new Error("provider timeout"));
    await expect(createMembershipRefund(input)).rejects.toThrow("provider timeout");
    await expect(createMembershipRefund(request(randomUUID()))).rejects.toThrow(
      "REFUND_RECONCILIATION_REQUIRED"
    );
    expect((await createMembershipRefund(input)).status).toBe("succeeded");
    expect(provider.refund.mock.calls[0][1]).toEqual(provider.refund.mock.calls[1][1]);
  });
  it("does not retry an ambiguous operation after Stripe's retention window", async () => {
    const input = request(randomUUID());
    provider.refund.mockRejectedValueOnce(new Error("timeout"));
    await expect(createMembershipRefund(input)).rejects.toThrow("timeout");
    await db.billingRefund.updateMany({
      where: { membershipId },
      data: { createdAt: new Date(Date.now() - 25 * 3600000) },
    });
    await expect(createMembershipRefund(input)).rejects.toThrow("REFUND_RECONCILIATION_REQUIRED");
    expect(provider.refund).toHaveBeenCalledTimes(1);
  });
  it("records class credits exactly once under concurrent retries", async () => {
    const input = { ...request(randomUUID()), refundAsCredit: true, creditAmount: 2 };
    await Promise.all([createMembershipRefund(input), createMembershipRefund(input)]);
    expect(await db.creditLedgerEntry.count({ where: { userId } })).toBe(1);
    expect(await db.billingRefund.count({ where: { membershipId, status: "credited" } })).toBe(1);
    expect(provider.refund).not.toHaveBeenCalled();
  });
});
