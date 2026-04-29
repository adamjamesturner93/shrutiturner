import { BillingRefundStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const membershipFindUniqueMock = vi.fn();
const refundAggregateMock = vi.fn();
const refundCreateMock = vi.fn();
const addCreditsMock = vi.fn();
const createAdminActionLogMock = vi.fn();
const stripeInvoiceRetrieveMock = vi.fn();
const stripeRefundCreateMock = vi.fn();
const recordSubscriptionComplianceEventMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    membershipSubscription: {
      findUnique: membershipFindUniqueMock,
    },
    billingRefund: {
      aggregate: refundAggregateMock,
      create: refundCreateMock,
    },
  },
}));

vi.mock("@/lib/credits/credit-service", () => ({
  addCredits: addCreditsMock,
}));

vi.mock("@/lib/admin/action-log-service", () => ({
  createAdminActionLog: createAdminActionLogMock,
}));

vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({
    invoices: {
      retrieve: stripeInvoiceRetrieveMock,
    },
    refunds: {
      create: stripeRefundCreateMock,
    },
  }),
}));

vi.mock("@/lib/billing/subscription-compliance", () => ({
  recordSubscriptionComplianceEvent: recordSubscriptionComplianceEventMock,
}));

const { createMembershipRefund } = await import("@/lib/billing/refund-service");

describe("membership refund service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    membershipFindUniqueMock.mockResolvedValue({
      id: "membership_123",
      userId: "user_123",
      latestInvoiceId: "in_123",
      latestInvoiceAmountPence: 2900,
    });
    refundAggregateMock.mockResolvedValue({ _sum: { amountPence: 0 } });
    refundCreateMock.mockResolvedValue({
      id: "refund_123",
      status: BillingRefundStatus.pending,
    });
    addCreditsMock.mockResolvedValue({});
    createAdminActionLogMock.mockResolvedValue({});
    recordSubscriptionComplianceEventMock.mockResolvedValue({});
    stripeInvoiceRetrieveMock.mockResolvedValue({ payment_intent: "pi_123" });
    stripeRefundCreateMock.mockResolvedValue({ id: "re_123", status: "pending" });
  });

  it("prevents refunds above the remaining membership invoice amount", async () => {
    refundAggregateMock.mockResolvedValue({ _sum: { amountPence: 2500 } });

    await expect(
      createMembershipRefund({
        membershipId: "membership_123",
        actorUserId: "admin_123",
        amountPence: 500,
        reason: "Too much paid",
      })
    ).rejects.toThrow("REFUND_AMOUNT_EXCEEDS_REMAINING");

    expect(stripeRefundCreateMock).not.toHaveBeenCalled();
    expect(refundCreateMock).not.toHaveBeenCalled();
  });

  it("records credit-instead adjustments without calling Stripe refunds", async () => {
    await createMembershipRefund({
      membershipId: "membership_123",
      actorUserId: "admin_123",
      amountPence: 1800,
      reason: "Client requested credits",
      refundAsCredit: true,
      creditAmount: 2,
    });

    expect(stripeRefundCreateMock).not.toHaveBeenCalled();
    expect(refundCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountPence: 1800,
          refundedAsCredit: true,
          status: BillingRefundStatus.credited,
          stripeInvoiceId: "in_123",
        }),
      })
    );
    expect(addCreditsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_123",
        amount: 2,
        createdByUserId: "admin_123",
      })
    );
  });
});
