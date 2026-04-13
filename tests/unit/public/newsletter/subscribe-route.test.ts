import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyTurnstileTokenMock = vi.fn();
const getNewsletterSignupContentMock = vi.fn();
const userFindUniqueMock = vi.fn();
const createPendingMarketingSubscriberMock = vi.fn();
const sendNewsletterVerificationEmailMock = vi.fn();
const recordNewsletterSignupEventMock = vi.fn();

vi.mock("@/lib/content", () => ({
  getNewsletterSignupContent: getNewsletterSignupContentMock,
}));

vi.mock("@/lib/turnstile", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
  verifyTurnstileToken: verifyTurnstileTokenMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: userFindUniqueMock,
    },
  },
}));

vi.mock("@/lib/newsletter/subscriber-service", () => ({
  createPendingMarketingSubscriber: createPendingMarketingSubscriberMock,
}));

vi.mock("@/lib/newsletter/email-service", () => ({
  sendNewsletterVerificationEmail: sendNewsletterVerificationEmailMock,
}));

vi.mock("@/lib/newsletter/event-service", () => ({
  recordNewsletterSignupEvent: recordNewsletterSignupEventMock,
}));

const route = await import("@/app/api/newsletter/subscribe/route");

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/newsletter/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    route.resetNewsletterSignupRateLimitStore();

    verifyTurnstileTokenMock.mockResolvedValue(true);
    getNewsletterSignupContentMock.mockResolvedValue({
      consentText: "No spam. Unsubscribe anytime.",
      successMessage: "Please check your inbox to confirm your email address.",
    });
    userFindUniqueMock.mockResolvedValue(null);
    createPendingMarketingSubscriberMock.mockResolvedValue({
      state: "pending",
      subscriber: { id: "sub_123" },
      verificationToken: "verify_123",
    });
    sendNewsletterVerificationEmailMock.mockResolvedValue(undefined);
    recordNewsletterSignupEventMock.mockResolvedValue(undefined);
  });

  it("rejects requests without a first name", async () => {
    const response = await route.POST(
      createRequest({
        email: "reader@example.com",
        firstName: "",
        consent: true,
        marketingOptIn: true,
        source: "holding-page",
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Please enter your first name.",
    });
  });

  it("rejects an invalid email address", async () => {
    const response = await route.POST(
      createRequest({
        email: "not-an-email",
        firstName: "Reader",
        consent: true,
        marketingOptIn: true,
        source: "holding-page",
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Please enter a valid email address.",
    });
  });

  it("rate limits repeated requests from the same IP", async () => {
    const body = {
      email: "reader@example.com",
      firstName: "Reader",
      consent: true,
      marketingOptIn: true,
      source: "holding-page",
      turnstileToken: "token",
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await route.POST(createRequest(body));
      expect(response.status).toBe(200);
    }

    const response = await route.POST(createRequest(body));
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      message: "Too many requests. Please try again shortly.",
    });
  });

  it("returns a confirmation message when the subscriber is already active", async () => {
    createPendingMarketingSubscriberMock.mockResolvedValue({
      state: "subscribed",
      subscriber: { id: "sub_123" },
      verificationToken: null,
    });

    const response = await route.POST(
      createRequest({
        email: "reader@example.com",
        firstName: "Reader",
        consent: true,
        marketingOptIn: true,
        source: "subscribe",
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: "You’re already confirmed. Keep an eye on your inbox for the next update.",
    });
    expect(sendNewsletterVerificationEmailMock).not.toHaveBeenCalled();
  });

  it("creates a pending subscriber and sends a verification email on success", async () => {
    const response = await route.POST(
      createRequest({
        email: "reader@example.com",
        firstName: "Reader",
        consent: true,
        marketingOptIn: true,
        source: "holding-page",
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: "Please check your inbox to confirm your email address.",
    });
    expect(createPendingMarketingSubscriberMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      firstName: "Reader",
      userId: null,
      source: "holding-page",
      surface: "newsletter_signup_holding-page",
      wordingText: "No spam. Unsubscribe anytime.",
    });
    expect(sendNewsletterVerificationEmailMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      firstName: "Reader",
      source: "holding-page",
      subscriberId: "sub_123",
      verificationToken: "verify_123",
    });
    expect(recordNewsletterSignupEventMock).toHaveBeenNthCalledWith(1, {
      email: "reader@example.com",
      source: "holding-page",
      eventType: "subscribe_attempt",
    });
    expect(recordNewsletterSignupEventMock).toHaveBeenNthCalledWith(2, {
      email: "reader@example.com",
      source: "holding-page",
      eventType: "subscribe_pending",
    });
  });
});
