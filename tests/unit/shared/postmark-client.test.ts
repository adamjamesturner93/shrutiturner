import { EmailDeliveryAttemptStatus, EmailDeliveryStatus } from "@prisma/client";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const renderMock = vi.fn();
const sendEmailMock = vi.fn();
const emailDeliveryCreateMock = vi.fn();
const emailDeliveryFindUniqueMock = vi.fn();
const emailDeliveryFindManyMock = vi.fn();
const emailDeliveryUpdateMock = vi.fn();
const emailDeliveryUpdateManyMock = vi.fn();
const emailDeliveryAttemptCreateMock = vi.fn();
const emailDeliveryAttemptUpdateMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@react-email/render", () => ({
  render: renderMock,
}));

vi.mock("postmark", () => ({
  ServerClient: vi.fn(function ServerClient() {
    return {
      sendEmail: sendEmailMock,
    };
  }),
}));

vi.mock("@/lib/env", () => ({
  env: {
    POSTMARK_FROM_EMAIL: "Shruti Turner <hello@example.com>",
    POSTMARK_TRANSACTIONAL_MESSAGE_STREAM: "transactional",
    POSTMARK_MARKETING_MESSAGE_STREAM: "broadcast",
  },
  getPostmarkToken: () => "postmark-token",
}));

vi.mock("@/lib/db", () => ({
  db: {
    emailDelivery: {
      create: emailDeliveryCreateMock,
      findUnique: emailDeliveryFindUniqueMock,
      findMany: emailDeliveryFindManyMock,
      update: emailDeliveryUpdateMock,
      updateMany: emailDeliveryUpdateManyMock,
    },
    emailDeliveryAttempt: {
      create: emailDeliveryAttemptCreateMock,
      update: emailDeliveryAttemptUpdateMock,
    },
    $transaction: transactionMock,
  },
}));

const { attemptEmailDelivery, processDueEmailDeliveries, sendPostmarkReactEmail } =
  await import("@/lib/postmark/client");

describe("postmark delivery dispatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderMock.mockResolvedValue("<p>Hello</p>");
    sendEmailMock.mockResolvedValue({ MessageID: "message_123" });
    emailDeliveryCreateMock.mockResolvedValue({ id: "delivery_123" });
    emailDeliveryUpdateManyMock.mockResolvedValue({ count: 1 });
    emailDeliveryAttemptCreateMock.mockResolvedValue({ id: "attempt_123" });
    emailDeliveryAttemptUpdateMock.mockResolvedValue({});
    emailDeliveryUpdateMock.mockResolvedValue({});
    emailDeliveryFindManyMock.mockResolvedValue([]);
    transactionMock.mockResolvedValue(undefined);
  });

  it("persists and sends a transactional email with delivery metadata", async () => {
    emailDeliveryFindUniqueMock.mockResolvedValue({
      id: "delivery_123",
      toEmail: "reader@example.com",
      userId: "user_123",
      campaignId: null,
      templateKey: "account-welcome",
      category: "transactional",
      subject: "Welcome",
      tag: "account-welcome",
      messageStream: "transactional",
      status: EmailDeliveryStatus.queued,
      retryable: true,
      attemptCount: 0,
      maxAttempts: 5,
      payloadJson: {
        htmlBody: "<p>Hello</p>",
        textBody: "Hello",
      },
      metadataJson: {
        emailType: "account-welcome",
      },
    });

    await expect(
      sendPostmarkReactEmail({
        to: "reader@example.com",
        subject: "Welcome",
        react: createElement("div"),
        textBody: "Hello",
        tag: "account-welcome",
        templateKey: "account-welcome",
        userId: "user_123",
      })
    ).resolves.toEqual({
      skipped: false,
      status: EmailDeliveryStatus.sent,
      attemptNumber: 1,
      providerMessageId: "message_123",
    });

    expect(emailDeliveryCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        toEmail: "reader@example.com",
        userId: "user_123",
        templateKey: "account-welcome",
        payloadJson: expect.objectContaining({
          htmlBody: "<p>Hello</p>",
          textBody: "Hello",
        }),
      }),
    });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        From: "Shruti Turner <hello@example.com>",
        To: "reader@example.com",
        MessageStream: "transactional",
        Metadata: expect.objectContaining({
          deliveryId: "delivery_123",
          emailCategory: "transactional",
          templateKey: "account-welcome",
        }),
      })
    );
    expect(emailDeliveryAttemptUpdateMock).toHaveBeenCalledWith({
      where: { id: "attempt_123" },
      data: expect.objectContaining({
        status: EmailDeliveryAttemptStatus.sent,
        providerMessageId: "message_123",
      }),
    });
    expect(emailDeliveryUpdateMock).toHaveBeenCalledWith({
      where: { id: "delivery_123" },
      data: expect.objectContaining({
        status: EmailDeliveryStatus.sent,
        attemptCount: 1,
        providerMessageId: "message_123",
        nextRetryAt: null,
      }),
    });
  });

  it("records failed attempts and schedules retryable delivery failures", async () => {
    sendEmailMock.mockRejectedValue(new Error("Postmark unavailable"));
    emailDeliveryFindUniqueMock.mockResolvedValue({
      id: "delivery_456",
      toEmail: "reader@example.com",
      userId: null,
      campaignId: null,
      templateKey: "auth-security-alert",
      category: "transactional",
      subject: "Security alert",
      tag: "auth-security-alert",
      messageStream: "transactional",
      status: EmailDeliveryStatus.queued,
      retryable: true,
      attemptCount: 0,
      maxAttempts: 5,
      payloadJson: {
        htmlBody: "<p>Alert</p>",
        textBody: "Alert",
      },
      metadataJson: null,
    });

    await expect(attemptEmailDelivery("delivery_456")).rejects.toThrow("Postmark unavailable");

    expect(emailDeliveryAttemptUpdateMock).toHaveBeenCalledWith({
      where: { id: "attempt_123" },
      data: expect.objectContaining({
        status: EmailDeliveryAttemptStatus.failed,
        errorMessage: "Postmark unavailable",
      }),
    });
    expect(emailDeliveryUpdateMock).toHaveBeenCalledWith({
      where: { id: "delivery_456" },
      data: expect.objectContaining({
        status: EmailDeliveryStatus.failed,
        attemptCount: 1,
        lastError: "Postmark unavailable",
        nextRetryAt: expect.any(Date),
      }),
    });
  });

  it("processes due deliveries without stopping after one failure", async () => {
    emailDeliveryFindManyMock.mockResolvedValue([{ id: "delivery_a" }, { id: "delivery_b" }]);
    emailDeliveryFindUniqueMock
      .mockResolvedValueOnce({
        id: "delivery_a",
        toEmail: "a@example.com",
        userId: null,
        campaignId: null,
        templateKey: "notice",
        category: "transactional",
        subject: "Notice",
        tag: "notice",
        messageStream: "transactional",
        status: EmailDeliveryStatus.queued,
        retryable: false,
        attemptCount: 0,
        maxAttempts: 1,
        payloadJson: {
          htmlBody: "<p>Notice</p>",
          textBody: "Notice",
        },
        metadataJson: null,
      })
      .mockResolvedValueOnce({ status: EmailDeliveryStatus.dead_letter })
      .mockResolvedValueOnce({
        id: "delivery_b",
        toEmail: "b@example.com",
        userId: null,
        campaignId: null,
        templateKey: "welcome",
        category: "transactional",
        subject: "Welcome",
        tag: "welcome",
        messageStream: "transactional",
        status: EmailDeliveryStatus.queued,
        retryable: true,
        attemptCount: 0,
        maxAttempts: 5,
        payloadJson: {
          htmlBody: "<p>Welcome</p>",
          textBody: "Welcome",
        },
        metadataJson: null,
      });
    sendEmailMock.mockRejectedValueOnce(new Error("Postmark unavailable")).mockResolvedValueOnce({
      MessageID: "message_b",
    });

    await expect(processDueEmailDeliveries()).resolves.toEqual({
      attempted: 2,
      sent: 1,
      failed: 0,
      deadLettered: 1,
      skipped: 0,
    });
  });
});
