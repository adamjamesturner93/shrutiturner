import { beforeEach, describe, expect, it, vi } from "vitest";

const sendPostmarkReactEmailMock = vi.fn();

vi.mock("@/lib/postmark/client", () => ({
  sendPostmarkReactEmail: sendPostmarkReactEmailMock,
}));

const { sendMarketingUnsubscribeRequestEmail } = await import("@/lib/newsletter/unsubscribe-email");

describe("sendMarketingUnsubscribeRequestEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes unsubscribe confirmation through the shared transactional email dispatcher", async () => {
    sendPostmarkReactEmailMock.mockResolvedValue(undefined);

    await sendMarketingUnsubscribeRequestEmail({
      email: "reader@example.com",
      unsubscribeUrl: "https://shrutiturner.co.uk/unsubscribe?token=token_123",
    });

    expect(sendPostmarkReactEmailMock).toHaveBeenCalledWith({
      to: "reader@example.com",
      subject: "Confirm your unsubscribe request",
      react: expect.any(Object),
      textBody: expect.stringContaining("https://shrutiturner.co.uk/unsubscribe?token=token_123"),
      tag: "newsletter-unsubscribe-request",
      templateKey: "newsletter-unsubscribe-request",
      category: "transactional",
      metadata: {
        unsubscribeUrl: "https://shrutiturner.co.uk/unsubscribe?token=token_123",
      },
      retryable: false,
      maxAttempts: 1,
      dispatchMode: "immediate_required",
    });
  });
});
