import { beforeEach, describe, expect, it, vi } from "vitest";

const membershipFindFirstMock = vi.fn();
const membershipUpdateMock = vi.fn();
const getActiveCatalogItemMock = vi.fn();
const stripeSubscriptionRetrieveMock = vi.fn();
const stripeSubscriptionUpdateMock = vi.fn();
const stripeScheduleCreateMock = vi.fn();
const stripeScheduleUpdateMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    membershipSubscription: {
      findFirst: membershipFindFirstMock,
      update: membershipUpdateMock,
    },
  },
}));

vi.mock("@/lib/billing/catalog-service", () => ({
  getActiveCatalogItem: getActiveCatalogItemMock,
}));

vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({
    subscriptions: {
      retrieve: stripeSubscriptionRetrieveMock,
      update: stripeSubscriptionUpdateMock,
    },
    subscriptionSchedules: {
      create: stripeScheduleCreateMock,
      update: stripeScheduleUpdateMock,
    },
  }),
}));

const { changeMembershipPlan } = await import("@/lib/membership/membership-service");

const currentMembership = {
  id: "membership_123",
  userId: "user_123",
  plan: "movewell",
  billingInterval: "monthly",
  status: "active",
  pricePence: 2900,
  classesPerWeek: 999,
  classesUsedThisWeek: 2,
  startsAt: new Date("2026-01-01T00:00:00.000Z"),
  renewsAt: new Date("2026-05-01T00:00:00.000Z"),
  endsAt: null,
  cancelAtPeriodEnd: false,
  stripeSubscriptionId: "sub_123",
  stripePriceId: "price_monthly",
  stripeCurrentPeriodEnd: new Date("2026-05-01T00:00:00.000Z"),
};

describe("changeMembershipPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    membershipFindFirstMock.mockResolvedValue(currentMembership);
    membershipUpdateMock.mockImplementation(async ({ data }) => ({
      ...currentMembership,
      ...data,
    }));
    getActiveCatalogItemMock.mockResolvedValue({
      key: "membership_movewell_annual",
      stripePriceId: "price_annual",
      unitAmountPence: 29000,
    });
    stripeSubscriptionRetrieveMock.mockResolvedValue({
      id: "sub_123",
      status: "active",
      current_period_start: 1775000000,
      current_period_end: 1777592000,
      cancel_at: null,
      cancel_at_period_end: false,
      items: {
        data: [{ id: "si_123", price: { id: "price_monthly" }, quantity: 1 }],
      },
    });
    stripeSubscriptionUpdateMock.mockResolvedValue({
      id: "sub_123",
      status: "active",
      current_period_end: 1809128000,
      cancel_at: null,
      cancel_at_period_end: false,
      items: {
        data: [{ id: "si_123", price: { id: "price_annual" }, quantity: 1 }],
      },
    });
    stripeScheduleCreateMock.mockResolvedValue({ id: "sched_123" });
    stripeScheduleUpdateMock.mockResolvedValue({ id: "sched_123" });
  });

  it("upgrades monthly to annual immediately with Stripe proration", async () => {
    const result = await changeMembershipPlan({
      userId: "user_123",
      plan: "movewell",
      billingInterval: "annual",
    });

    expect(stripeSubscriptionUpdateMock).toHaveBeenCalledWith("sub_123", {
      cancel_at_period_end: false,
      items: [{ id: "si_123", price: "price_annual" }],
      metadata: {
        plan: "movewell",
        billingInterval: "annual",
        userId: "user_123",
        changeMode: "immediate_prorated_upgrade",
      },
      proration_behavior: "create_prorations",
    });
    expect(stripeScheduleCreateMock).not.toHaveBeenCalled();
    expect(result.mode).toBe("immediate");
    expect(membershipUpdateMock).toHaveBeenCalled();
  });

  it("schedules annual to monthly downgrades for the paid period end", async () => {
    membershipFindFirstMock.mockResolvedValue({
      ...currentMembership,
      billingInterval: "annual",
      pricePence: 29000,
      stripePriceId: "price_annual",
    });
    getActiveCatalogItemMock.mockResolvedValue({
      key: "membership_movewell_monthly",
      stripePriceId: "price_monthly",
      unitAmountPence: 2900,
    });
    stripeSubscriptionRetrieveMock.mockResolvedValue({
      id: "sub_123",
      status: "active",
      current_period_start: 1775000000,
      current_period_end: 1806531200,
      cancel_at: null,
      cancel_at_period_end: false,
      items: {
        data: [{ id: "si_123", price: { id: "price_annual" }, quantity: 1 }],
      },
    });

    const result = await changeMembershipPlan({
      userId: "user_123",
      plan: "movewell",
      billingInterval: "monthly",
    });

    expect(stripeSubscriptionUpdateMock).not.toHaveBeenCalled();
    expect(stripeScheduleCreateMock).toHaveBeenCalledWith({ from_subscription: "sub_123" });
    expect(stripeScheduleUpdateMock).toHaveBeenCalledWith("sched_123", {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: "price_annual", quantity: 1 }],
          start_date: 1775000000,
          end_date: 1806531200,
        },
        {
          items: [{ price: "price_monthly", quantity: 1 }],
          start_date: 1806531200,
          metadata: {
            plan: "movewell",
            billingInterval: "monthly",
            userId: "user_123",
            changeMode: "period_end_downgrade",
          },
        },
      ],
    });
    expect(result.mode).toBe("period_end");
  });
});
