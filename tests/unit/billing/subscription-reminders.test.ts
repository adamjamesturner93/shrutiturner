import {
  MembershipBillingInterval,
  MembershipStatus,
  SubscriptionComplianceEventKind,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const membershipFindManyMock = vi.fn();
const complianceFindFirstMock = vi.fn();
const complianceCountMock = vi.fn();
const complianceCreateMock = vi.fn();
const sendSubscriptionNoticeEmailMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    membershipSubscription: {
      findMany: membershipFindManyMock,
    },
    subscriptionComplianceEvent: {
      findFirst: complianceFindFirstMock,
      count: complianceCountMock,
      create: complianceCreateMock,
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendSubscriptionNoticeEmail: sendSubscriptionNoticeEmailMock,
}));

vi.mock("@/lib/env", () => ({
  getBaseSiteUrlFromEnv: () => "http://localhost:3000",
}));

const { processDueSubscriptionComplianceNotices } =
  await import("@/lib/billing/subscription-compliance");

describe("processDueSubscriptionComplianceNotices annual reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    complianceFindFirstMock.mockResolvedValue(null);
    complianceCountMock.mockResolvedValue(0);
    complianceCreateMock.mockResolvedValue({});
    sendSubscriptionNoticeEmailMock.mockResolvedValue({ success: true });
  });

  it("sends 30-day and 7-day annual renewal reminders through the notice email sender", async () => {
    const now = new Date("2026-04-01T09:00:00.000Z");
    membershipFindManyMock.mockResolvedValue([
      {
        id: "membership_30",
        userId: "user_30",
        billingInterval: MembershipBillingInterval.annual,
        status: MembershipStatus.active,
        renewsAt: new Date("2026-05-01T09:00:00.000Z"),
        cancelAtPeriodEnd: false,
        startsAt: new Date("2025-05-01T09:00:00.000Z"),
        user: {
          id: "user_30",
          email: "thirty@example.com",
          firstName: "Thirty",
          name: "Thirty Member",
        },
      },
      {
        id: "membership_7",
        userId: "user_7",
        billingInterval: MembershipBillingInterval.annual,
        status: MembershipStatus.active,
        renewsAt: new Date("2026-04-08T09:00:00.000Z"),
        cancelAtPeriodEnd: false,
        startsAt: new Date("2025-04-08T09:00:00.000Z"),
        user: {
          id: "user_7",
          email: "seven@example.com",
          firstName: "Seven",
          name: "Seven Member",
        },
      },
    ]);

    await expect(processDueSubscriptionComplianceNotices(now)).resolves.toEqual({
      processed: 2,
      scanned: 2,
    });

    expect(sendSubscriptionNoticeEmailMock).toHaveBeenCalledTimes(2);
    expect(sendSubscriptionNoticeEmailMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        email: "thirty@example.com",
        subject: "30-day reminder: annual membership renewal",
        tag: `subscription-${SubscriptionComplianceEventKind.annual_renewal_reminder}`,
        metadata: expect.objectContaining({ leadDays: "30" }),
      })
    );
    expect(sendSubscriptionNoticeEmailMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        email: "seven@example.com",
        subject: "7-day reminder: annual membership renewal",
        metadata: expect.objectContaining({ leadDays: "7" }),
      })
    );
    expect(complianceCreateMock).toHaveBeenCalledTimes(2);
  });
});
