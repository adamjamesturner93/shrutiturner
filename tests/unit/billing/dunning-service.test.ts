import { MembershipDunningStatus, MembershipStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dunningFindManyMock = vi.fn();
const dunningUpdateMock = vi.fn();
const membershipUpdateMock = vi.fn();
const sendSubscriptionNoticeEmailMock = vi.fn();
const recordSubscriptionComplianceEventMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    membershipDunningCase: {
      findMany: dunningFindManyMock,
      update: dunningUpdateMock,
    },
    membershipSubscription: {
      update: membershipUpdateMock,
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendSubscriptionNoticeEmail: sendSubscriptionNoticeEmailMock,
}));

vi.mock("@/lib/env", () => ({
  getBaseSiteUrlFromEnv: () => "http://localhost:3000",
}));

vi.mock("@/lib/admin/action-log-service", () => ({
  createAdminActionLog: vi.fn(),
}));

vi.mock("@/lib/billing/subscription-compliance", () => ({
  recordSubscriptionComplianceEvent: recordSubscriptionComplianceEventMock,
}));

const { processDueMembershipDunningCases, membershipDunningAccessActive } =
  await import("@/lib/billing/dunning-service");

describe("membership dunning service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendSubscriptionNoticeEmailMock.mockResolvedValue({ success: true });
    recordSubscriptionComplianceEventMock.mockResolvedValue({});
    membershipUpdateMock.mockResolvedValue({});
  });

  it("suspends overdue dunning cases after the grace period", async () => {
    const now = new Date("2026-04-29T09:00:00.000Z");
    const dunningCase = {
      id: "dunning_123",
      userId: "user_123",
      membershipId: "membership_123",
      status: MembershipDunningStatus.open,
      amountDuePence: 2900,
      stripeInvoiceId: "in_123",
      invoiceUrl: "https://pay.stripe.com/invoice/in_123",
      firstFailedAt: new Date("2026-04-20T09:00:00.000Z"),
      graceEndsAt: new Date("2026-04-27T09:00:00.000Z"),
      graceExtendedUntil: null,
      day3ReminderSentAt: null,
      day6ReminderSentAt: null,
      suspendedAt: null,
      user: {
        id: "user_123",
        email: "taylor@example.com",
        firstName: "Taylor",
        name: "Taylor Member",
      },
      membership: { id: "membership_123" },
    };
    dunningFindManyMock.mockResolvedValue([dunningCase]);
    dunningUpdateMock.mockResolvedValue({
      ...dunningCase,
      status: MembershipDunningStatus.suspended,
      suspendedAt: now,
    });

    await expect(processDueMembershipDunningCases(now)).resolves.toEqual({
      scanned: 1,
      remindersSent: 0,
      suspended: 1,
    });

    expect(dunningUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "dunning_123" },
        data: expect.objectContaining({
          status: MembershipDunningStatus.suspended,
          suspendedAt: now,
        }),
      })
    );
    expect(membershipUpdateMock).toHaveBeenCalledWith({
      where: { id: "membership_123" },
      data: { status: MembershipStatus.paused },
    });
    expect(sendSubscriptionNoticeEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "taylor@example.com",
        subject: "Your Move Well Membership access is paused",
      })
    );
  });

  it("keeps access during grace and blocks it once suspended", () => {
    expect(
      membershipDunningAccessActive({
        membershipStatus: MembershipStatus.past_due,
        dunningCase: {
          status: MembershipDunningStatus.open,
          graceEndsAt: new Date("2026-05-01T09:00:00.000Z"),
        },
        now: new Date("2026-04-29T09:00:00.000Z"),
      })
    ).toBe(true);

    expect(
      membershipDunningAccessActive({
        membershipStatus: MembershipStatus.paused,
        dunningCase: {
          status: MembershipDunningStatus.suspended,
          graceEndsAt: new Date("2026-04-27T09:00:00.000Z"),
        },
        now: new Date("2026-04-29T09:00:00.000Z"),
      })
    ).toBe(false);
  });
});
