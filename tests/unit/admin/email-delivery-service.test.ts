import { EmailDeliveryStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const emailDeliveryCountMock = vi.fn();
const emailDeliveryFindFirstMock = vi.fn();
const emailDeliveryFindManyMock = vi.fn();
const emailDeliveryFindUniqueMock = vi.fn();
const emailDeliveryUpdateMock = vi.fn();
const newsletterSubscriberFindUniqueMock = vi.fn();
const attemptEmailDeliveryMock = vi.fn();
const createAdminActionLogMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    emailDelivery: {
      count: emailDeliveryCountMock,
      findFirst: emailDeliveryFindFirstMock,
      findMany: emailDeliveryFindManyMock,
      findUnique: emailDeliveryFindUniqueMock,
      update: emailDeliveryUpdateMock,
    },
    newsletterSubscriber: { findUnique: newsletterSubscriberFindUniqueMock },
  },
}));

vi.mock("@/lib/postmark/client", () => ({
  attemptEmailDelivery: attemptEmailDeliveryMock,
}));

vi.mock("@/lib/admin/action-log-service", () => ({
  createAdminActionLog: createAdminActionLogMock,
}));

const { getAdminEmailDeliveryHealth, resolveAdminEmailDelivery, retryAdminEmailDelivery } =
  await import("@/lib/admin/email-delivery-service");

describe("getAdminEmailDeliveryHealth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emailDeliveryCountMock
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    emailDeliveryFindFirstMock.mockResolvedValue({
      nextRetryAt: new Date("2026-05-01T10:00:00.000Z"),
    });
    emailDeliveryFindManyMock.mockResolvedValue([
      {
        id: "delivery_123",
        toEmail: "reader@example.com",
        templateKey: "booking-confirmation",
        category: "transactional",
        subject: "Booking confirmed",
        status: EmailDeliveryStatus.failed,
        attemptCount: 2,
        maxAttempts: 5,
        nextRetryAt: new Date("2026-05-01T10:00:00.000Z"),
        lastError: "Postmark unavailable",
        updatedAt: new Date("2026-05-01T09:00:00.000Z"),
      },
    ]);
    emailDeliveryUpdateMock.mockResolvedValue({ id: "delivery_123" });
    createAdminActionLogMock.mockResolvedValue(undefined);
    attemptEmailDeliveryMock.mockResolvedValue({ sent: true });
  });

  it("summarises failed and dead-letter email deliveries for admins", async () => {
    await expect(getAdminEmailDeliveryHealth()).resolves.toEqual({
      failedCount: 2,
      deadLetterCount: 1,
      retryQueuedCount: 1,
      nextRetryAt: "2026-05-01T10:00:00.000Z",
      recentFailures: [
        expect.objectContaining({
          id: "delivery_123",
          status: "failed",
          nextRetryAt: "2026-05-01T10:00:00.000Z",
          updatedAt: "2026-05-01T09:00:00.000Z",
        }),
      ],
    });
    expect(emailDeliveryFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: [EmailDeliveryStatus.failed, EmailDeliveryStatus.dead_letter] },
          resolvedAt: null,
        },
      })
    );
  });

  it("dismisses a failure so it no longer appears in delivery health", async () => {
    emailDeliveryFindUniqueMock.mockResolvedValue({
      id: "delivery_123",
      status: EmailDeliveryStatus.failed,
      toEmail: "reader@example.com",
      templateKey: "contentful-blogPost",
      resolvedAt: null,
    });

    const result = await resolveAdminEmailDelivery("delivery_123", {
      actorUserId: "admin_123",
      note: "Recipient unsubscribed",
    });

    expect(result).toEqual({ id: "delivery_123", resolvedAt: expect.any(String) });
    expect(emailDeliveryUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "delivery_123" },
        data: expect.objectContaining({
          resolvedByUserId: "admin_123",
          resolutionCode: "dismissed_by_admin",
          retryable: false,
        }),
      })
    );
  });

  it("does not retry marketing email for a recipient who has unsubscribed", async () => {
    emailDeliveryFindUniqueMock.mockResolvedValue({
      id: "delivery_123",
      status: EmailDeliveryStatus.failed,
      category: "marketing",
      toEmail: "reader@example.com",
      attemptCount: 1,
      maxAttempts: 3,
      resolvedAt: null,
    });
    newsletterSubscriberFindUniqueMock.mockResolvedValue({ status: "unsubscribed" });

    await expect(
      retryAdminEmailDelivery("delivery_123", { actorUserId: "admin_123" })
    ).rejects.toThrow("RECIPIENT_NOT_SUBSCRIBED");
    expect(attemptEmailDeliveryMock).not.toHaveBeenCalled();
    expect(emailDeliveryUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resolutionCode: "recipient_not_subscribed",
          retryable: false,
        }),
      })
    );
  });
});
