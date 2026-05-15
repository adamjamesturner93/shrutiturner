import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();
const isRateLimitedMock = vi.fn();
const submitContactFormMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/turnstile", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
  verifyTurnstileToken: verifyTurnstileTokenMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: isRateLimitedMock,
}));

vi.mock("@/lib/contact/service", () => ({
  submitContactForm: submitContactFormMock,
}));

const route = await import("@/app/api/contact/route");

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  firstName: "Taylor",
  lastName: "Jordan",
  email: "taylor@example.com",
  interest: "retreat",
  conditions: "Variable fatigue",
  howFound: "google",
  message: "I want to ask whether the retreat pace would suit a fluctuating condition.",
  contactConsent: true,
  contactConsentText: "I consent to being contacted about this enquiry.",
  turnstileToken: "turnstile-token",
  honeypot: "",
};

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123" } });
    verifyTurnstileTokenMock.mockResolvedValue(true);
    isRateLimitedMock.mockReturnValue(false);
    submitContactFormMock.mockResolvedValue({ id: "contact_123" });
  });

  it("passes contact consent through to the contact service", async () => {
    const response = await route.POST(createRequest(validBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, id: "contact_123" });
    expect(submitContactFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_123",
        firstName: "Taylor",
        lastName: "Jordan",
        email: "taylor@example.com",
        topic: "retreat",
        contactConsent: true,
        contactConsentText: "I consent to being contacted about this enquiry.",
      })
    );
  });

  it("rejects submissions without contact consent", async () => {
    submitContactFormMock.mockRejectedValue(new Error("CONSENT_REQUIRED"));

    const response = await route.POST(
      createRequest({
        ...validBody,
        contactConsent: false,
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Please complete all required fields.",
    });
  });
});
