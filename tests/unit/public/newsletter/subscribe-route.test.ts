import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmailMock = vi.fn();
const renderMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();
const getNewsletterSignupContentMock = vi.fn();
const userFindUniqueMock = vi.fn();
const subscribeMarketingEmailMock = vi.fn();

vi.mock("postmark", () => ({
  ServerClient: class {
    sendEmail = sendEmailMock;
  },
}));

vi.mock("@react-email/render", () => ({
  render: renderMock,
}));

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
  subscribeMarketingEmail: subscribeMarketingEmailMock,
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
    process.env.POSTMARK_API_TOKEN = "postmark-token";
    process.env.NEXT_PUBLIC_SITE_URL = "https://shrutiturner.com";

    renderMock.mockResolvedValue("<p>html</p>");
    verifyTurnstileTokenMock.mockResolvedValue(true);
    getNewsletterSignupContentMock.mockResolvedValue({
      slug: "default",
      hookText: 'Get "5 Yoga Poses That Actually Build Strength" - free:',
      formPlaceholder: "your.email@example.com",
      buttonLabel: "Subscribe",
      successMessage: "You're subscribed! Check your inbox.",
      consentText: "No spam. Unsubscribe anytime.",
      leadMagnetTitle: "Guide",
      popupDescription: "Popup description",
      emailSubject: "Welcome",
      emailBody: "Hi {{firstName}}",
      assetUrl: "https://shrutiturner.com/guide.pdf",
    });
    userFindUniqueMock.mockResolvedValue(null);
    subscribeMarketingEmailMock.mockResolvedValue({
      id: "sub_123",
      token: "token_123",
    });
    sendEmailMock.mockResolvedValue(undefined);
  });

  it("rejects an invalid email address", async () => {
    const response = await route.POST(
      createRequest({
        email: "not-an-email",
        consent: true,
        marketingOptIn: true,
        source: "subscribe",
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Please enter a valid email address.",
    });
  });

  it("rejects requests without consent", async () => {
    const response = await route.POST(
      createRequest({
        email: "reader@example.com",
        consent: false,
        marketingOptIn: false,
        source: "subscribe",
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "You must provide consent before subscribing.",
    });
  });

  it("rejects requests when turnstile verification fails", async () => {
    verifyTurnstileTokenMock.mockResolvedValue(false);

    const response = await route.POST(
      createRequest({
        email: "reader@example.com",
        consent: true,
        marketingOptIn: true,
        source: "homepage",
        turnstileToken: "bad-token",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Verification failed. Please try again.",
    });
  });

  it("rate limits repeated requests from the same IP", async () => {
    const body = {
      email: "reader@example.com",
      firstName: "Reader",
      consent: true,
      marketingOptIn: true,
      source: "footer",
      turnstileToken: "token",
    };

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await route.POST(createRequest(body));
      expect(response.status).toBe(200);
    }

    const response = await route.POST(createRequest(body));
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      message: "Too many requests. Please try again shortly.",
    });
  });

  it("sends the welcome email with subscriber metadata on success", async () => {
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
      message: "You're subscribed! Check your inbox.",
    });
    expect(subscribeMarketingEmailMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      userId: null,
      source: "subscribe",
    });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock.mock.calls[0]?.[0]).toMatchObject({
      To: "reader@example.com",
      Subject: "Welcome",
      Tag: "newsletter-signup",
      Metadata: expect.objectContaining({
        source: "subscribe",
        consent: "true",
        marketingOptIn: "true",
        subscriberId: "sub_123",
      }),
    });
  });
});
