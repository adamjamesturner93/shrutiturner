import { beforeEach, describe, expect, it, vi } from "vitest";

const expireCheckoutMock = vi.fn();
const approveBookingMock = vi.fn();
const approveGiftMock = vi.fn();
const sendEmailMock = vi.fn();
const createLogMock = vi.fn();
const stopRecordingMock = vi.fn();

const tx = {
  $queryRaw: vi.fn(),
  retreatDate: { findUnique: vi.fn(), update: vi.fn() },
  retreatCancellationRequest: { create: vi.fn(), update: vi.fn() },
  giftCancellationRequest: { create: vi.fn(), update: vi.fn() },
  retreatBooking: { update: vi.fn() },
  retreatBookingInstalment: { updateMany: vi.fn() },
  giftPurchase: { update: vi.fn() },
  retreatOnlineAccessEntitlement: { updateMany: vi.fn() },
  replayEntitlement: { updateMany: vi.fn() },
};

const db = {
  user: { findUnique: vi.fn() },
  $transaction: vi.fn(),
  retreatDate: { findUnique: vi.fn(), update: vi.fn() },
  retreatCancellationRequest: { findMany: vi.fn() },
  giftCancellationRequest: { findMany: vi.fn() },
};

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/billing/stripe-client", () => ({
  getStripeClient: () => ({ checkout: { sessions: { expire: expireCheckoutMock } } }),
}));
vi.mock("@/lib/retreats/service", () => ({
  approveRetreatCancellation: approveBookingMock,
}));
vi.mock("@/lib/gifts/service", () => ({ approveGiftCancellation: approveGiftMock }));
vi.mock("@/lib/postmark/client", () => ({ sendPostmarkReactEmail: sendEmailMock }));
vi.mock("@/lib/admin/action-log-service", () => ({ createAdminActionLog: createLogMock }));
vi.mock("@/lib/daily/service", () => ({ stopRoomRecording: stopRecordingMock }));
vi.mock("@/lib/app-url", () => ({
  buildAbsoluteUrl: (path: string) => `https://studio.example${path}`,
}));

const { cancelAdminRetreatEvent, getAdminRetreatCancellationPreview } =
  await import("@/lib/retreats/event-cancellation");

describe("admin retreat event cancellation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.user.findUnique.mockResolvedValue({ email: "admin@example.com" });
    db.$transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    tx.retreatCancellationRequest.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: `booking-request-${data.bookingId}` })
    );
    tx.giftCancellationRequest.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: `gift-request-${data.giftPurchaseId}` })
    );
    expireCheckoutMock.mockResolvedValue({ id: "expired" });
    approveBookingMock.mockResolvedValue({ status: "completed" });
    approveGiftMock.mockResolvedValue({ status: "completed" });
    sendEmailMock.mockResolvedValue({ id: "email" });
    createLogMock.mockResolvedValue(undefined);
  });

  it("previews both guests and remaining captured funds without making changes", async () => {
    db.retreatDate.findUnique.mockResolvedValue({
      id: "date_1",
      status: "open",
      bookings: [
        {
          id: "booking_1",
          attendeeCount: 2,
          depositPaidPence: 18200,
          balancePaidPence: 0,
          giftPurchase: null,
          refunds: [{ amountPence: 2000 }],
        },
      ],
      giftPurchases: [
        { id: "gift_1", status: "purchased", totalPaidPence: 3500, refundedAmountPence: 500 },
        { id: "gift_2", status: "pending_payment", totalPaidPence: 3500, refundedAmountPence: 0 },
      ],
    });
    expect(await getAdminRetreatCancellationPreview("date_1")).toMatchObject({
      available: true,
      bookingCount: 1,
      guestCount: 2,
      giftCount: 2,
      refundPence: 19200,
      version: expect.any(String),
    });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(approveBookingMock).not.toHaveBeenCalled();
  });

  it("rejects a stale impact confirmation before any cancellation or refund", async () => {
    const original = { id: "date_1", status: "open", bookings: [], giftPurchases: [] };
    db.retreatDate.findUnique.mockResolvedValue(original);
    const preview = await getAdminRetreatCancellationPreview("date_1");
    tx.retreatDate.findUnique.mockResolvedValue({
      ...original,
      bookings: [
        {
          id: "new_booking",
          attendeeCount: 2,
          depositPaidPence: 18200,
          balancePaidPence: 0,
          giftPurchase: null,
          refunds: [],
        },
      ],
    });
    await expect(
      cancelAdminRetreatEvent({
        retreatDateId: "date_1",
        actorUserId: "admin_1",
        reason: "Unavailable",
        expectedVersion: preview.version,
      })
    ).rejects.toThrow("CANCELLATION_PREVIEW_CHANGED");
    expect(tx.retreatDate.update).not.toHaveBeenCalled();
    expect(tx.retreatCancellationRequest.create).not.toHaveBeenCalled();
    expect(approveBookingMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("closes pending checkouts and only submits refunds for captured payments", async () => {
    tx.retreatDate.findUnique.mockResolvedValue({
      id: "date_1",
      status: "open",
      retreatType: "online",
      retreatTitleSnapshot: "Live workshop",
      liveRecordingState: "idle",
      dailyRoomName: null,
      bookings: [
        {
          id: "booking_paid",
          bookingStatus: "paid_in_full",
          paymentStatus: "paid_in_full",
          depositPaidPence: 3500,
          balancePaidPence: 0,
          purchaserFirstName: "Paid",
          purchaserEmail: "paid@example.com",
          attendeeFirstName: "Paid",
          attendeeEmail: "paid@example.com",
          stripeDepositSessionId: "cs_paid",
          stripeBalanceSessionId: null,
          refunds: [],
          cancellationRequests: [],
          giftPurchase: null,
          instalments: [],
        },
        {
          id: "booking_pending",
          bookingStatus: "pending",
          paymentStatus: "unpaid",
          depositPaidPence: 0,
          balancePaidPence: 0,
          purchaserFirstName: "Pending",
          purchaserEmail: "pending@example.com",
          attendeeFirstName: "Pending",
          attendeeEmail: "pending@example.com",
          stripeDepositSessionId: "cs_pending",
          stripeBalanceSessionId: null,
          refunds: [],
          cancellationRequests: [],
          giftPurchase: null,
          instalments: [{ status: "pending", stripeCheckoutSessionId: "cs_pending_instalment" }],
        },
      ],
      giftPurchases: [
        {
          id: "gift_paid",
          status: "purchased",
          totalPaidPence: 3500,
          refundedAmountPence: 0,
          purchaserFirstName: "Gift buyer",
          purchaserEmail: "gift-buyer@example.com",
          recipientFirstName: "Recipient",
          recipientEmail: "recipient@example.com",
          stripeCheckoutSessionId: "cs_gift_paid",
          cancellationRequests: [],
        },
        {
          id: "gift_pending",
          status: "pending_payment",
          totalPaidPence: 3500,
          refundedAmountPence: 0,
          purchaserFirstName: "Pending gift buyer",
          purchaserEmail: "pending-gift@example.com",
          recipientFirstName: "Pending recipient",
          recipientEmail: "pending-recipient@example.com",
          stripeCheckoutSessionId: "cs_gift_pending",
          cancellationRequests: [],
        },
      ],
    });

    const result = await cancelAdminRetreatEvent({
      retreatDateId: "date_1",
      actorUserId: "admin_1",
      reason: "Instructor unavailable",
    });

    expect(result).toMatchObject({ status: "cancelled", refundsQueued: 2, failedRefunds: 0 });
    expect(approveBookingMock).toHaveBeenCalledTimes(1);
    expect(approveBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: "booking-request-booking_paid" })
    );
    expect(approveGiftMock).toHaveBeenCalledTimes(1);
    expect(approveGiftMock).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: "gift-request-gift_paid" })
    );
    expect(tx.retreatBooking.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "booking_pending" } })
    );
    expect(tx.giftPurchase.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "gift_pending" } })
    );
    expect(expireCheckoutMock).toHaveBeenCalledWith("cs_pending");
    expect(expireCheckoutMock).toHaveBeenCalledWith("cs_pending_instalment");
    expect(expireCheckoutMock).toHaveBeenCalledWith("cs_gift_pending");
  });
});
