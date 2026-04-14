import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const sendEmailMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();
const getNewsletterSignupContentMock = vi.fn();
const sendLeadMagnetDeliveryEmailMock = vi.fn();
const sendNewsletterVerificationEmailMock = vi.fn();

vi.mock("postmark", () => ({
  ServerClient: class {
    sendEmail = sendEmailMock;
  },
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

vi.mock("@/lib/newsletter/email-service", () => ({
  sendLeadMagnetDeliveryEmail: sendLeadMagnetDeliveryEmailMock,
  sendNewsletterVerificationEmail: sendNewsletterVerificationEmailMock,
}));

const { db } = await import("@/lib/db");
const { hashVerificationToken } = await import("@/lib/newsletter/tokens");
const newsletterRoute = await import("@/app/api/newsletter/subscribe/route");
const verifyRoute = await import("@/app/api/newsletter/verify/route");
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
    process.env.NEXT_PUBLIC_SITE_URL = "https://shrutiturner.co.uk";

    verifyTurnstileTokenMock.mockResolvedValue(true);
    getNewsletterSignupContentMock.mockResolvedValue({
      slug: "default",
      hookText: 'Get "Why Some Bodies Need Strength Before More Stretching" - free:',
      formPlaceholder: "your.email@example.com",
      buttonLabel: "Subscribe",
      successMessage: "Please check your inbox to confirm your email address.",
      consentText: "No spam. Unsubscribe anytime.",
      leadMagnetTitle: "Guide",
      popupDescription: "Popup description",
      emailSubject: "Confirm your email to get your free guide",
      emailBody: "Hi {{firstName}}",
      assetUrl: "https://shrutiturner.co.uk/guide.pdf",
    });
    sendEmailMock.mockResolvedValue(undefined);
    sendLeadMagnetDeliveryEmailMock.mockResolvedValue(undefined);
    sendNewsletterVerificationEmailMock.mockResolvedValue(undefined);

    await cleanupTestRows();
  });

  afterAll(async () => {
    await cleanupTestRows();
  });

  it("creates or links a pending subscriber before verification", async () => {
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
      firstName: "Integration",
      userId: user.id,
      status: "pending",
      source: "subscribe",
    });
    expect(subscriber?.verificationTokenHash).toBeTruthy();
    expect(subscriber?.verificationTokenExpiresAt).toBeTruthy();
    expect(subscriber?.verifiedAt).toBeNull();
    expect(preference).toBeNull();
  });

  it("verifies a pending subscriber and updates the user's marketing preference", async () => {
    const email = makeEmail("verify");
    const rawToken = "verify_token_123";
    const user = await db.user.create({
      data: {
        email,
        firstName: "Verify",
      },
    });
    const subscriber = await db.newsletterSubscriber.create({
      data: {
        email,
        firstName: "Verify",
        userId: user.id,
        source: "holding-page",
        status: "pending",
        token: `tok_${Date.now()}_verify`,
        consentedAt: new Date(),
        verificationTokenHash: hashVerificationToken(rawToken),
        verificationTokenExpiresAt: new Date(Date.now() + 60_000),
      },
    });

    const response = await verifyRoute.GET(
      new Request(`http://localhost/api/newsletter/verify?token=${rawToken}`)
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/?verified=success");

    const refreshedSubscriber = await db.newsletterSubscriber.findUnique({
      where: { id: subscriber.id },
    });
    const preference = await db.userNotificationPreference.findUnique({
      where: { userId: user.id },
    });

    expect(refreshedSubscriber?.status).toBe("subscribed");
    expect(refreshedSubscriber?.verifiedAt).toBeTruthy();
    expect(refreshedSubscriber?.verificationTokenHash).toBeNull();
    expect(preference?.marketingEmails).toBe(true);
    expect(sendLeadMagnetDeliveryEmailMock).toHaveBeenCalledWith({
      email,
      firstName: "Verify",
      subscriberId: subscriber.id,
    });
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
    expect(String(sendEmailMock.mock.calls[0]?.[0]?.TextBody ?? "")).toContain(
      "https://shrutiturner.co.uk/unsubscribe?token="
    );
  });
});
