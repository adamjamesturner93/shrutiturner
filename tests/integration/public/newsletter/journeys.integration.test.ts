import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const sendEmailMock = vi.fn();
const renderMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();
const getNewsletterSignupContentMock = vi.fn();

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

vi.mock("@/lib/turnstile", async () => {
  const actual = await vi.importActual<typeof import("@/lib/turnstile")>("@/lib/turnstile");
  return {
    ...actual,
    getClientIp: vi.fn(() => "127.0.0.1"),
    verifyTurnstileToken: verifyTurnstileTokenMock,
  };
});

const { db } = await import("@/lib/db");
const newsletterRoute = await import("@/app/api/newsletter/subscribe/route");
const unsubscribeRoute = await import("@/app/api/unsubscribe/route");

function createRequest(url: string, body: Record<string, unknown>) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeEmail(label: string) {
  return `integration-newsletter-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function cleanupTestRows() {
  await db.userNotificationPreference.deleteMany({
    where: {
      user: {
        email: {
          startsWith: "integration-newsletter-",
        },
      },
    },
  });
  await db.newsletterSubscriber.deleteMany({
    where: {
      email: {
        startsWith: "integration-newsletter-",
      },
    },
  });
  await db.user.deleteMany({
    where: {
      email: {
        startsWith: "integration-newsletter-",
      },
    },
  });
}

describe("newsletter public journeys integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    newsletterRoute.resetNewsletterSignupRateLimitStore();
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
    sendEmailMock.mockResolvedValue(undefined);

    await cleanupTestRows();
  });

  afterAll(async () => {
    await cleanupTestRows();
  });

  it("creates or links a subscriber and updates the user's marketing preference", async () => {
    const email = makeEmail("subscribe");
    const user = await db.user.create({
      data: {
        email,
        firstName: "Integration",
      },
    });

    const response = await newsletterRoute.POST(
      createRequest("http://localhost/api/newsletter/subscribe", {
        email,
        firstName: "Integration",
        consent: true,
        marketingOptIn: true,
        source: "subscribe",
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(200);
    const subscriber = await db.newsletterSubscriber.findUnique({ where: { email } });
    const preference = await db.userNotificationPreference.findUnique({
      where: { userId: user.id },
    });

    expect(subscriber).toMatchObject({
      email,
      userId: user.id,
      status: "subscribed",
      source: "subscribe",
    });
    expect(subscriber?.token).toBeTruthy();
    expect(preference?.marketingEmails).toBe(true);
  });

  it("processes a token unsubscribe against the live database", async () => {
    const email = makeEmail("token");
    const user = await db.user.create({
      data: {
        email,
        firstName: "Token",
      },
    });
    const subscriber = await db.newsletterSubscriber.create({
      data: {
        email,
        userId: user.id,
        status: "subscribed",
        token: `tok_${Date.now()}`,
      },
    });
    await db.userNotificationPreference.create({
      data: {
        userId: user.id,
        marketingEmails: true,
      },
    });

    const response = await unsubscribeRoute.POST(
      createRequest("http://localhost/api/unsubscribe", {
        token: subscriber.token,
      })
    );

    expect(response.status).toBe(200);

    const refreshedSubscriber = await db.newsletterSubscriber.findUnique({
      where: { id: subscriber.id },
    });
    const preference = await db.userNotificationPreference.findUnique({
      where: { userId: user.id },
    });

    expect(refreshedSubscriber?.status).toBe("unsubscribed");
    expect(refreshedSubscriber?.unsubscribedAt).toBeTruthy();
    expect(preference?.marketingEmails).toBe(false);
  });

  it("sends a confirmation email for manual unsubscribe without changing status immediately", async () => {
    const email = makeEmail("manual");
    const subscriber = await db.newsletterSubscriber.create({
      data: {
        email,
        status: "subscribed",
        token: `tok_${Date.now()}_manual`,
        source: "footer",
      },
    });

    const response = await unsubscribeRoute.POST(
      createRequest("http://localhost/api/unsubscribe", {
        email,
      })
    );

    expect(response.status).toBe(200);
    const refreshedSubscriber = await db.newsletterSubscriber.findUnique({
      where: { id: subscriber.id },
    });

    expect(refreshedSubscriber?.status).toBe("subscribed");
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock.mock.calls[0]?.[0]).toMatchObject({
      To: email,
      Subject: "Confirm your unsubscribe request",
    });
    expect(String(sendEmailMock.mock.calls[0]?.[0]?.TextBody ?? "")).toContain(subscriber.token);
  });
});
