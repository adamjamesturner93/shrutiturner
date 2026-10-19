import { readReceipt } from "@/lib/analytics/receipt";
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

it("issues anonymous proof only after verification, with a distinct guide delivery outcome", async () => {
  verifyMarketingEmailByTokenMock.mockResolvedValue({
    id: "private-id",
    email: "private@example.com",
    firstName: "Private",
    source: "footer",
  });
  recordNewsletterSignupEventMock.mockResolvedValue(undefined);
  for (const delivered of [true, false]) {
    if (delivered)
      sendLeadMagnetDeliveryEmailMock.mockResolvedValue({ skipped: false, status: "sent" });
    else sendLeadMagnetDeliveryEmailMock.mockRejectedValue(new Error("delivery failed"));
    const response = await route.GET(
      new Request("https://shrutiturner.co.uk/api/newsletter/verify?token=secret", {
        headers: { cookie: "st_analytics=granted" },
      })
    );
    const receipt = readReceipt(response.cookies.get("st_analytics_receipt")?.value);
    expect(receipt).toMatchObject({ source: "footer", guide: delivered });
    expect(JSON.stringify(receipt)).not.toMatch(/private|secret/);
  }
  verifyMarketingEmailByTokenMock.mockRejectedValue(new Error("INVALID_TOKEN"));
  const failed = await route.GET(
    new Request("https://shrutiturner.co.uk/api/newsletter/verify?token=secret", {
      headers: { cookie: "st_analytics=granted" },
    })
  );
  expect(failed.cookies.get("st_analytics_receipt")).toBeUndefined();
});

it.each([undefined, "st_analytics=denied", "newsletter_consent=true", "st_analytics=invalid"])(
  "verification and guide delivery succeed without an analytics receipt for consent %s",
  async (cookie) => {
    vi.clearAllMocks();
    verifyMarketingEmailByTokenMock.mockResolvedValue({
      id: "subscriber",
      email: "test@example.com",
      firstName: "Test",
      source: "footer",
    });
    sendLeadMagnetDeliveryEmailMock.mockResolvedValue({ skipped: false, status: "sent" });
    recordNewsletterSignupEventMock.mockResolvedValue(undefined);
    const response = await route.GET(
      new Request("https://shrutiturner.co.uk/api/newsletter/verify?token=valid", {
        headers: cookie ? { cookie } : {},
      })
    );
    expect(response.headers.get("location")).toBe("https://shrutiturner.co.uk/?verified=success");
    expect(verifyMarketingEmailByTokenMock).toHaveBeenCalledWith("valid");
    expect(sendLeadMagnetDeliveryEmailMock).toHaveBeenCalledOnce();
    expect(response.cookies.get("st_analytics_receipt")).toBeUndefined();
  }
);
it.each([{ skipped: true, status: "sent" }, { skipped: false, status: "failed" }, undefined])(
  "does not record guide initiation for unaccepted delivery %j",
  async (delivery) => {
    verifyMarketingEmailByTokenMock.mockResolvedValue({
      id: "subscriber",
      email: "test@example.com",
      source: "footer",
    });
    sendLeadMagnetDeliveryEmailMock.mockResolvedValue(delivery);
    const response = await route.GET(
      new Request("https://shrutiturner.co.uk/api/newsletter/verify?token=valid", {
        headers: { cookie: "st_analytics=granted" },
      })
    );
    expect(readReceipt(response.cookies.get("st_analytics_receipt")?.value)).toMatchObject({
      guide: false,
    });
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain("Max-Age=600");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
  }
);
