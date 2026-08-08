import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const coachingClientProfileCountMock = vi.fn();
const coachingSubscriptionProjectionCountMock = vi.fn();
const coachingSubscriptionProjectionFindManyMock = vi.fn();
const coachingSubscriptionProjectionFindFirstMock = vi.fn();
const billingMetricDailyAggregateMock = vi.fn();
const refreshCoachingSubscriptionProjectionsMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    coachingClientProfile: {
      count: coachingClientProfileCountMock,
    },
    coachingSubscriptionProjection: {
      count: coachingSubscriptionProjectionCountMock,
      findMany: coachingSubscriptionProjectionFindManyMock,
      findFirst: coachingSubscriptionProjectionFindFirstMock,
    },
    billingMetricDaily: {
      aggregate: billingMetricDailyAggregateMock,
    },
  },
}));

vi.mock("@/lib/billing/coaching-subscription-projection", () => ({
  refreshCoachingSubscriptionProjections: refreshCoachingSubscriptionProjectionsMock,
  monthlyRecurringValuePence: (subscription: {
    unitAmountPence: number;
    quantity: number;
    interval: string;
    intervalCount: number;
  }) => {
    const amount = subscription.unitAmountPence * subscription.quantity;
    return subscription.interval === "year"
      ? Math.round(amount / (12 * subscription.intervalCount))
      : Math.round(amount / subscription.intervalCount);
  },
}));

const { getAdminBusinessSummary } = await import("@/lib/admin/business-service");

describe("getAdminBusinessSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T12:00:00.000Z"));
    refreshCoachingSubscriptionProjectionsMock.mockResolvedValue({ refreshed: 0, failed: 0 });
    coachingClientProfileCountMock.mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    coachingSubscriptionProjectionCountMock.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    coachingSubscriptionProjectionFindManyMock.mockResolvedValue([
      {
        unitAmountPence: 15_000,
        quantity: 1,
        interval: "month",
        intervalCount: 1,
        cancelAt: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date("2026-09-01T00:00:00.000Z"),
      },
      {
        unitAmountPence: 120_000,
        quantity: 1,
        interval: "year",
        intervalCount: 1,
        cancelAt: null,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date("2026-08-20T00:00:00.000Z"),
      },
    ]);
    billingMetricDailyAggregateMock
      .mockResolvedValueOnce({ _sum: { failedPaymentsCount: 1 } })
      .mockResolvedValueOnce({ _sum: { failedPaymentsCount: 3 } });
    coachingSubscriptionProjectionFindFirstMock.mockResolvedValue({
      lastStripeEventAt: new Date("2026-08-04T11:55:00.000Z"),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports active 1:1 clients and normalised recurring revenue", async () => {
    await expect(getAdminBusinessSummary()).resolves.toEqual({
      activeOneToOneClients: 2,
      operationalOneToOneClients: 2,
      trackedSubscriptions: 2,
      subscriptionsNeedingSync: 0,
      monthlyRecurringRevenuePence: 25_000,
      newPaidClientsThisMonth: 1,
      endingSoonCount: 1,
      failedPayments7d: 1,
      failedPayments30d: 3,
      dataFreshnessIso: "2026-08-04T11:55:00.000Z",
    });
  });
});
