import { beforeEach, describe, expect, it, vi } from "vitest";

const creditLedgerFindManyMock = vi.fn();
const referralLedgerFindManyMock = vi.fn();
const billingEventFindManyMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    creditLedgerEntry: {
      findMany: creditLedgerFindManyMock,
    },
    referralLedgerEntry: {
      findMany: referralLedgerFindManyMock,
    },
    billingEvent: {
      findMany: billingEventFindManyMock,
    },
  },
}));

const { getBillingHistory } = await import("@/lib/billing/history-service");

describe("getBillingHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    creditLedgerFindManyMock.mockResolvedValue([]);
    referralLedgerFindManyMock.mockResolvedValue([]);
    billingEventFindManyMock.mockResolvedValue([]);
  });

  it("maps Stripe invoice URLs onto paid and failed subscription billing rows", async () => {
    billingEventFindManyMock.mockResolvedValue([
      {
        id: "event_paid",
        type: "invoice.paid",
        createdAt: new Date("2026-04-28T07:00:00.000Z"),
        payloadJson: {
          data: {
            object: {
              id: "in_paid",
              amount_paid: 2900,
              hosted_invoice_url: "https://pay.stripe.com/invoice/in_paid",
            },
          },
        },
      },
      {
        id: "event_failed",
        type: "invoice.payment_failed",
        createdAt: new Date("2026-04-27T07:00:00.000Z"),
        payloadJson: {
          data: {
            object: {
              id: "in_failed",
              amount_due: 2900,
              hosted_invoice_url: "https://pay.stripe.com/invoice/in_failed",
            },
          },
        },
      },
    ]);

    const rows = await getBillingHistory("user_123", 10);

    expect(rows).toMatchObject([
      {
        id: "invoice_paid_event_paid",
        kind: "membership_charge",
        amountPence: 2900,
        status: "paid",
        stripeInvoiceId: "in_paid",
        invoiceUrl: "https://pay.stripe.com/invoice/in_paid",
      },
      {
        id: "billing_event_failed",
        kind: "payment_failed",
        amountPence: 2900,
        status: "failed",
        stripeInvoiceId: "in_failed",
        invoiceUrl: "https://pay.stripe.com/invoice/in_failed",
      },
    ]);
  });

  it("includes one-off credit purchases and internal refunds in the same feed", async () => {
    creditLedgerFindManyMock.mockResolvedValue([
      {
        id: "credit_refund",
        type: "booking_refund",
        createdAt: new Date("2026-04-26T07:00:00.000Z"),
        description: "Class cancellation",
        amount: 1,
      },
    ]);
    billingEventFindManyMock.mockResolvedValue([
      {
        id: "event_checkout",
        type: "checkout.session.completed",
        createdAt: new Date("2026-04-28T07:00:00.000Z"),
        payloadJson: {
          data: {
            object: {
              id: "cs_123",
              amount_total: 2400,
              metadata: { kind: "credits" },
            },
          },
        },
      },
    ]);

    const rows = await getBillingHistory("user_123", 10);

    expect(rows.map((row) => row.kind)).toEqual(["credit_purchase", "credit_refund"]);
    expect(rows[0]).toMatchObject({
      amountPence: 2400,
      stripeCheckoutSessionId: "cs_123",
    });
    expect(rows[1]).toMatchObject({
      description: "Class cancellation (1 credit refunded)",
      status: "refunded",
    });
  });
});
