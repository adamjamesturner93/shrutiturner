import { EmailDeliveryStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const emailDeliveryCountMock = vi.fn();
const emailDeliveryFindFirstMock = vi.fn();
const emailDeliveryFindManyMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    emailDelivery: {
      count: emailDeliveryCountMock,
      findFirst: emailDeliveryFindFirstMock,
      findMany: emailDeliveryFindManyMock,
    },
  },
}));

const { getAdminEmailDeliveryHealth } = await import("@/lib/admin/email-delivery-service");

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
        },
      })
    );
  });
});
