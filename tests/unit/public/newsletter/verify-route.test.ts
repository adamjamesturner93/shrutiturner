import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyMarketingEmailByTokenMock = vi.fn();
const sendLeadMagnetDeliveryEmailMock = vi.fn();
const recordNewsletterSignupEventMock = vi.fn();

vi.mock("@/lib/newsletter/subscriber-service", () => ({
  verifyMarketingEmailByToken: verifyMarketingEmailByTokenMock,
}));

vi.mock("@/lib/newsletter/email-service", () => ({
  sendLeadMagnetDeliveryEmail: sendLeadMagnetDeliveryEmailMock,
}));

vi.mock("@/lib/newsletter/event-service", () => ({
  recordNewsletterSignupEvent: recordNewsletterSignupEventMock,
}));

const route = await import("@/app/api/newsletter/verify/route");

describe("GET /api/newsletter/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendLeadMagnetDeliveryEmailMock.mockResolvedValue(undefined);
    recordNewsletterSignupEventMock.mockResolvedValue(undefined);
  });

  it("redirects to success after verifying and sending the guide", async () => {
    verifyMarketingEmailByTokenMock.mockResolvedValue({
      id: "sub_123",
      email: "reader@example.com",
      firstName: "Reader",
      source: "holding-page",
    });

    const response = await route.GET(
      new Request("https://shrutiturner.co.uk/api/newsletter/verify?token=verify_123")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://shrutiturner.co.uk/?verified=success");
    expect(sendLeadMagnetDeliveryEmailMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      firstName: "Reader",
      subscriberId: "sub_123",
    });
    expect(recordNewsletterSignupEventMock).toHaveBeenNthCalledWith(1, {
      email: "reader@example.com",
      source: "holding-page",
      eventType: "verify_success",
    });
    expect(recordNewsletterSignupEventMock).toHaveBeenNthCalledWith(2, {
      email: "reader@example.com",
      source: "holding-page",
      eventType: "lead_magnet_sent",
    });
  });

  it("redirects to invalid when the token is missing or invalid", async () => {
    const missingTokenResponse = await route.GET(
      new Request("https://shrutiturner.co.uk/api/newsletter/verify")
    );

    expect(missingTokenResponse.status).toBe(307);
    expect(missingTokenResponse.headers.get("location")).toBe(
      "https://shrutiturner.co.uk/?verified=invalid"
    );

    verifyMarketingEmailByTokenMock.mockRejectedValue(new Error("INVALID_TOKEN"));

    const invalidTokenResponse = await route.GET(
      new Request("https://shrutiturner.co.uk/api/newsletter/verify?token=bad-token")
    );

    expect(invalidTokenResponse.status).toBe(307);
    expect(invalidTokenResponse.headers.get("location")).toBe(
      "https://shrutiturner.co.uk/?verified=invalid"
    );
  });
});
