import { BillingEventStatus, CreditEntryType, MembershipStatus } from "@prisma/client";
import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const userFindUniqueMock = vi.fn();
const userUpdateMock = vi.fn();
const billingEventFindUniqueMock = vi.fn();
const billingEventCreateMock = vi.fn();
const billingEventUpdateMock = vi.fn();
const billingEventFindManyMock = vi.fn();
const billingEventCountMock = vi.fn();
const billingMetricDailyUpsertMock = vi.fn();
const membershipSubscriptionFindFirstMock = vi.fn();
const membershipSubscriptionFindManyMock = vi.fn();
const membershipSubscriptionCountMock = vi.fn();
const membershipSubscriptionUpdateMock = vi.fn();
const creditLedgerEntryFindFirstMock = vi.fn();
const referralLedgerEntryFindFirstMock = vi.fn();
const billingCatalogItemFindFirstMock = vi.fn();

const stripeCustomerCreateMock = vi.fn();
const stripeCheckoutSessionCreateMock = vi.fn();
const stripeSubscriptionRetrieveMock = vi.fn();
const getActiveCatalogItemMock = vi.fn();
const resolvePromotionCodeDiscountMock = vi.fn();
const computeReferralDiscountPenceMock = vi.fn();
const consumeReferralDiscountMock = vi.fn();
const addCreditsMock = vi.fn();
const startOrSwitchMembershipMock = vi.fn();
const qualifyReferralMock = vi.fn();
const processGiftPurchaseCheckoutCompletedMock = vi.fn();
const processRetreatCheckoutCompletedMock = vi.fn();
const processSmallGroupCheckoutCompletedMock = vi.fn();
const sendMembershipCheckoutConfirmationNoticeMock = vi.fn();
const sendRenewalCoolingOffNoticeMock = vi.fn();
const processStripeDisputeEventMock = vi.fn();

vi.mock("@/lib/env", () => ({
  getBaseSiteUrlFromEnv: () => "http://localhost:3000",
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: userFindUniqueMock,
      update: userUpdateMock,
    },
    billingEvent: {
      findUnique: billingEventFindUniqueMock,
      create: billingEventCreateMock,
      update: billingEventUpdateMock,
      findMany: billingEventFindManyMock,
      count: billingEventCountMock,
    },
    billingMetricDaily: {
      upsert: billingMetricDailyUpsertMock,
    },
    membershipSubscription: {
      findFirst: membershipSubscriptionFindFirstMock,
      findMany: membershipSubscriptionFindManyMock,
      count: membershipSubscriptionCountMock,
      update: membershipSubscriptionUpdateMock,
    },
    creditLedgerEntry: {
      findFirst: creditLedgerEntryFindFirstMock,
    },
    referralLedgerEntry: {
      findFirst: referralLedgerEntryFindFirstMock,
    },
    billingCatalogItem: {
      findFirst: billingCatalogItemFindFirstMock,
    },
  },
}));

vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({
    customers: {
      create: stripeCustomerCreateMock,
    },
    checkout: {
      sessions: {
        create: stripeCheckoutSessionCreateMock,
      },
    },
    subscriptions: {
      retrieve: stripeSubscriptionRetrieveMock,
    },
  }),
}));

vi.mock("@/lib/billing/catalog-service", () => ({
  getActiveCatalogItem: getActiveCatalogItemMock,
  resolvePromotionCodeDiscount: resolvePromotionCodeDiscountMock,
}));

vi.mock("@/lib/referrals/referral-discount-service", () => ({
  computeReferralDiscountPence: computeReferralDiscountPenceMock,
  consumeReferralDiscount: consumeReferralDiscountMock,
}));

vi.mock("@/lib/credits/credit-service", () => ({
  addCredits: addCreditsMock,
}));

vi.mock("@/lib/membership/membership-service", () => ({
  startOrSwitchMembership: startOrSwitchMembershipMock,
}));

vi.mock("@/lib/referrals/referral-service", () => ({
  qualifyReferral: qualifyReferralMock,
}));

vi.mock("@/lib/gifts/service", () => ({
  processGiftPurchaseCheckoutCompleted: processGiftPurchaseCheckoutCompletedMock,
}));

vi.mock("@/lib/retreats/service", () => ({
  processRetreatCheckoutCompleted: processRetreatCheckoutCompletedMock,
}));

vi.mock("@/lib/small-groups/service", () => ({
  processSmallGroupCheckoutCompleted: processSmallGroupCheckoutCompletedMock,
}));

vi.mock("@/lib/billing/subscription-compliance", () => ({
  sendMembershipCheckoutConfirmationNotice: sendMembershipCheckoutConfirmationNoticeMock,
  sendRenewalCoolingOffNotice: sendRenewalCoolingOffNoticeMock,
}));

vi.mock("@/lib/billing/dispute-service", () => ({
  processStripeDisputeEvent: processStripeDisputeEventMock,
}));

const { createMembershipCheckoutSession, processStripeWebhookEvent } =
  await import("@/lib/billing/billing-service");

function event(input: { id: string; type: string; object: Record<string, unknown> }) {
  return {
    id: input.id,
    type: input.type,
    data: {
      object: input.object,
    },
  } as unknown as Stripe.Event;
}

function mockMetricRecomputeDefaults() {
  billingEventFindManyMock.mockResolvedValue([]);
  billingEventCountMock.mockResolvedValue(0);
  membershipSubscriptionFindManyMock.mockResolvedValue([]);
  membershipSubscriptionCountMock.mockResolvedValue(0);
  billingMetricDailyUpsertMock.mockResolvedValue({});
}

describe("billing-service Stripe integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getActiveCatalogItemMock.mockResolvedValue({
      stripePriceId: "price_membership_monthly",
      unitAmountPence: 2900,
      currency: "GBP",
    });
    resolvePromotionCodeDiscountMock.mockResolvedValue(null);
    computeReferralDiscountPenceMock.mockResolvedValue(0);
    stripeCustomerCreateMock.mockResolvedValue({ id: "cus_new" });
    stripeCheckoutSessionCreateMock.mockResolvedValue({
      id: "cs_membership",
      url: "https://checkout.stripe.com/session",
    });
    stripeSubscriptionRetrieveMock.mockResolvedValue({
      id: "sub_123",
      status: "active",
      current_period_end: 1770000000,
      cancel_at: null,
      cancel_at_period_end: false,
      items: {
        data: [{ price: { id: "price_membership_monthly" } }],
      },
    });
    userFindUniqueMock.mockResolvedValue({
      id: "user_123",
      email: "taylor@example.com",
      name: "Taylor Member",
      stripeCustomerId: null,
    });
    userUpdateMock.mockResolvedValue({});
    billingEventCreateMock.mockResolvedValue({ id: "billing_event_123" });
    billingEventUpdateMock.mockResolvedValue({});
    creditLedgerEntryFindFirstMock.mockResolvedValue(null);
    referralLedgerEntryFindFirstMock.mockResolvedValue(null);
    processGiftPurchaseCheckoutCompletedMock.mockResolvedValue(false);
    processRetreatCheckoutCompletedMock.mockResolvedValue(false);
    processSmallGroupCheckoutCompletedMock.mockResolvedValue(false);
    qualifyReferralMock.mockResolvedValue(undefined);
    consumeReferralDiscountMock.mockResolvedValue(undefined);
    addCreditsMock.mockResolvedValue(undefined);
    startOrSwitchMembershipMock.mockResolvedValue({ id: "membership_123" });
    membershipSubscriptionUpdateMock.mockResolvedValue({ id: "membership_123" });
    billingCatalogItemFindFirstMock.mockResolvedValue({ key: "membership_movewell_monthly" });
    mockMetricRecomputeDefaults();
  });

  it("creates recurring membership checkout server-side and links a Stripe customer to the user", async () => {
    const result = await createMembershipCheckoutSession(
      "user_123",
      "movewell",
      "monthly",
      undefined,
      "movewell",
      {
        successPath: "/dashboard/membership?checkout=success",
        cancelPath: "/dashboard/membership",
        disclosureVersion: "2026-04-03",
        disclosureAcceptedAt: new Date("2026-04-03T10:00:00.000Z"),
      }
    );

    expect(result.checkoutUrl).toBe("https://checkout.stripe.com/session");
    expect(stripeCustomerCreateMock).toHaveBeenCalledWith({
      email: "taylor@example.com",
      name: "Taylor Member",
      metadata: { userId: "user_123" },
    });
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "user_123" },
      data: { stripeCustomerId: "cus_new" },
    });
    expect(stripeCheckoutSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        customer: "cus_new",
        success_url: "http://localhost:3000/dashboard/membership?checkout=success",
        cancel_url: "http://localhost:3000/dashboard/membership",
        metadata: expect.objectContaining({
          userId: "user_123",
          kind: "membership",
          plan: "movewell",
          billingInterval: "monthly",
          disclosureVersion: "2026-04-03",
        }),
      })
    );
  });

  it("does not reprocess a webhook event already marked as processed", async () => {
    billingEventFindUniqueMock.mockResolvedValue({
      id: "billing_event_123",
      status: BillingEventStatus.processed,
    });

    await expect(
      processStripeWebhookEvent(event({ id: "evt_seen", type: "invoice.paid", object: {} }))
    ).resolves.toEqual({ idempotent: true });

    expect(billingEventCreateMock).not.toHaveBeenCalled();
    expect(billingEventUpdateMock).not.toHaveBeenCalled();
  });

  it("links a Stripe customer to a user from customer metadata", async () => {
    billingEventFindUniqueMock.mockResolvedValue(null);
    userFindUniqueMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "user_123", name: null, stripeCustomerId: null });

    await processStripeWebhookEvent(
      event({
        id: "evt_customer_created",
        type: "customer.created",
        object: {
          id: "cus_123",
          email: "taylor@example.com",
          name: "Taylor Member",
          metadata: { userId: "user_123" },
        },
      })
    );

    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "user_123" },
      data: {
        stripeCustomerId: "cus_123",
        name: "Taylor Member",
      },
    });
    expect(billingEventUpdateMock).toHaveBeenLastCalledWith({
      where: { id: "billing_event_123" },
      data: { status: BillingEventStatus.processed, processedAt: expect.any(Date) },
    });
  });

  it("clears a stale Stripe customer id when Stripe deletes the customer", async () => {
    billingEventFindUniqueMock.mockResolvedValue(null);
    userFindUniqueMock
      .mockResolvedValueOnce({ id: "user_123" })
      .mockResolvedValueOnce({ id: "user_123" });

    await processStripeWebhookEvent(
      event({
        id: "evt_customer_deleted",
        type: "customer.deleted",
        object: {
          id: "cus_123",
          deleted: true,
        },
      })
    );

    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "user_123" },
      data: { stripeCustomerId: null },
    });
  });

  it("marks the member past due from a verified invoice payment failure webhook", async () => {
    billingEventFindUniqueMock.mockResolvedValue(null);
    userFindUniqueMock.mockResolvedValue({ id: "user_123" });
    membershipSubscriptionFindFirstMock.mockResolvedValue({ id: "membership_123" });

    await processStripeWebhookEvent(
      event({
        id: "evt_failed",
        type: "invoice.payment_failed",
        object: {
          id: "in_failed",
          customer: "cus_123",
          amount_due: 2900,
        },
      })
    );

    expect(billingEventCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "stripe",
        providerEventId: "evt_failed",
        type: "invoice.payment_failed",
        status: BillingEventStatus.received,
        userId: "user_123",
      }),
    });
    expect(membershipSubscriptionUpdateMock).toHaveBeenCalledWith({
      where: { id: "membership_123" },
      data: { status: MembershipStatus.past_due },
    });
    expect(billingEventUpdateMock).toHaveBeenLastCalledWith({
      where: { id: "billing_event_123" },
      data: { status: BillingEventStatus.processed, processedAt: expect.any(Date) },
    });
  });

  it("syncs recurring membership entitlement from a paid invoice webhook", async () => {
    billingEventFindUniqueMock.mockResolvedValue(null);
    userFindUniqueMock.mockResolvedValue({ id: "user_123" });
    membershipSubscriptionFindFirstMock.mockResolvedValue({
      id: "membership_123",
      trialEndsAt: null,
      latestInvoicePaidAt: null,
      billingInterval: "monthly",
    });
    membershipSubscriptionUpdateMock.mockResolvedValue({
      id: "membership_123",
      user: { email: "taylor@example.com", firstName: "Taylor", name: "Taylor Member" },
    });

    await processStripeWebhookEvent(
      event({
        id: "evt_paid",
        type: "invoice.paid",
        object: {
          id: "in_paid",
          customer: "cus_123",
          amount_paid: 2900,
          metadata: {},
          lines: {
            data: [
              {
                price: { id: "price_membership_monthly" },
                period: { end: 1770000000 },
              },
            ],
          },
          subscription: "sub_123",
        },
      })
    );

    expect(startOrSwitchMembershipMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_123",
        plan: "movewell",
        billingInterval: "monthly",
        stripeSubscriptionId: "sub_123",
        stripePriceId: "price_membership_monthly",
        nextPeriodEnd: expect.any(Date),
      })
    );
    expect(membershipSubscriptionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "membership_123" },
        data: expect.objectContaining({
          latestInvoiceId: "in_paid",
          latestInvoiceAmountPence: 2900,
          latestInvoicePaidAt: expect.any(Date),
        }),
      })
    );
    expect(qualifyReferralMock).toHaveBeenCalledWith({
      referredUserId: "user_123",
      notes: "Auto-qualified on first paid subscription invoice.",
    });
  });

  it("syncs subscription cancellation status from a subscription deleted webhook", async () => {
    billingEventFindUniqueMock.mockResolvedValue(null);
    userFindUniqueMock.mockResolvedValue({ id: "user_123" });
    membershipSubscriptionFindFirstMock.mockResolvedValue({
      id: "membership_123",
      billingInterval: "monthly",
      pricePence: 2900,
      stripePriceId: "price_membership_monthly",
    });

    await processStripeWebhookEvent(
      event({
        id: "evt_subscription_deleted",
        type: "customer.subscription.deleted",
        object: {
          id: "sub_123",
          customer: "cus_123",
          status: "canceled",
          cancel_at_period_end: false,
          cancel_at: 1770000000,
          items: {
            data: [{ price: { id: "price_membership_monthly" } }],
          },
        },
      })
    );

    expect(membershipSubscriptionUpdateMock).toHaveBeenCalledWith({
      where: { id: "membership_123" },
      data: expect.objectContaining({
        status: MembershipStatus.cancelled,
        billingInterval: "monthly",
        pricePence: 2900,
        stripePriceId: "price_membership_monthly",
        cancelAtPeriodEnd: false,
        endsAt: expect.any(Date),
      }),
    });
  });

  it("creates membership entitlement from a completed subscription checkout webhook", async () => {
    billingEventFindUniqueMock.mockResolvedValue(null);
    billingCatalogItemFindFirstMock.mockResolvedValue({ key: "membership_movewell_annual" });
    stripeSubscriptionRetrieveMock.mockResolvedValue({
      id: "sub_annual",
      status: "active",
      current_period_end: 1800000000,
      cancel_at: null,
      cancel_at_period_end: false,
      items: {
        data: [{ price: { id: "price_membership_annual" } }],
      },
    });
    const trialEndsAt = new Date("2026-04-17T10:00:00.000Z");
    startOrSwitchMembershipMock.mockResolvedValue({
      id: "membership_annual",
      pricePence: 29000,
      trialEndsAt,
    });
    userFindUniqueMock.mockResolvedValue({
      email: "taylor@example.com",
      firstName: "Taylor",
      name: "Taylor Member",
    });

    await processStripeWebhookEvent(
      event({
        id: "evt_membership_checkout",
        type: "checkout.session.completed",
        object: {
          id: "cs_membership",
          created: 1770000000,
          subscription: "sub_annual",
          metadata: {
            userId: "user_123",
            kind: "membership",
            plan: "movewell",
            billingInterval: "annual",
            disclosureVersion: "2026-04-03",
            disclosureAcceptedAt: "2026-04-03T10:00:00.000Z",
            complianceSnapshotJson: '{"source":"test"}',
          },
        },
      })
    );

    expect(stripeSubscriptionRetrieveMock).toHaveBeenCalledWith("sub_annual");
    expect(startOrSwitchMembershipMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_123",
        plan: "movewell",
        billingInterval: "annual",
        stripeSubscriptionId: "sub_annual",
        stripePriceId: "price_membership_annual",
        disclosureVersion: "2026-04-03",
        disclosureAcceptedAt: new Date("2026-04-03T10:00:00.000Z"),
        complianceSnapshotJson: { source: "test" },
        startedAt: new Date(1770000000 * 1000),
      })
    );
    expect(sendMembershipCheckoutConfirmationNoticeMock).toHaveBeenCalledWith({
      membershipId: "membership_annual",
      userId: "user_123",
      email: "taylor@example.com",
      firstName: "Taylor",
      billingInterval: "annual",
      pricePence: 29000,
      trialEndsAt,
      immediateStartSummary: null,
    });
  });

  it("does not grant duplicate credit entitlements for an already fulfilled checkout", async () => {
    billingEventFindUniqueMock.mockResolvedValue(null);
    creditLedgerEntryFindFirstMock.mockResolvedValue({ id: "credit_existing" });
    referralLedgerEntryFindFirstMock.mockResolvedValue({ id: "referral_existing" });

    await processStripeWebhookEvent(
      event({
        id: "evt_checkout_duplicate",
        type: "checkout.session.completed",
        object: {
          id: "cs_credits",
          amount_total: 2400,
          payment_intent: "pi_123",
          metadata: {
            userId: "user_123",
            kind: "credits",
            bundleSize: "3",
            referralDiscountPence: "1000",
          },
        },
      })
    );

    expect(addCreditsMock).not.toHaveBeenCalled();
    expect(consumeReferralDiscountMock).not.toHaveBeenCalled();
  });

  it("grants credit entitlements from a completed one-off checkout webhook only once", async () => {
    billingEventFindUniqueMock.mockResolvedValue(null);
    computeReferralDiscountPenceMock.mockResolvedValue(1000);

    await processStripeWebhookEvent(
      event({
        id: "evt_checkout",
        type: "checkout.session.completed",
        object: {
          id: "cs_credits",
          amount_total: 2400,
          payment_intent: "pi_123",
          metadata: {
            userId: "user_123",
            kind: "credits",
            bundleSize: "3",
            referralDiscountPence: "1000",
          },
        },
      })
    );

    expect(addCreditsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_123",
        amount: 3,
        type: CreditEntryType.purchase,
        description: "3-class bundle",
        sourceRef: "stripe:checkout:cs_credits",
        stripeCheckoutSessionId: "cs_credits",
        stripePaymentIntentId: "pi_123",
        expiresAt: expect.any(Date),
      })
    );
    expect(consumeReferralDiscountMock).toHaveBeenCalledWith({
      userId: "user_123",
      amountPence: 1000,
      description: "Referral credit applied to stripe:checkout:cs_credits",
      stripeCheckoutSessionId: "cs_credits",
    });
    expect(qualifyReferralMock).toHaveBeenCalledWith({
      referredUserId: "user_123",
      notes: "Auto-qualified on first paid purchase.",
    });
  });
});
