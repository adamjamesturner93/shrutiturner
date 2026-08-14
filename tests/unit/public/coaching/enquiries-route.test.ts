import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();
const isRateLimitedMock = vi.fn();
const submitCoachingEnquiryMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/turnstile", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
  verifyTurnstileToken: verifyTurnstileTokenMock,
}));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited: isRateLimitedMock }));
vi.mock("@/lib/coaching/service", () => ({
  submitCoachingEnquiry: submitCoachingEnquiryMock,
}));

const route = await import("@/app/api/coaching/enquiries/route");

const validBody = {
  name: "Taylor Example",
  email: "taylor@example.com",
  support: "Building strength",
  movement: "Two walks each week",
  context: "My capacity changes",
  outcome: "Train more confidently",
  extra: "",
  referral: "Google",
  consent: true,
  consentText: "I consent to this enquiry being processed.",
  turnstileToken: "turnstile-token",
  honeypot: "",
};

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/coaching/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/coaching/enquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_123" } });
    verifyTurnstileTokenMock.mockResolvedValue(true);
    isRateLimitedMock.mockReturnValue(false);
    submitCoachingEnquiryMock.mockResolvedValue({ id: "enquiry_123" });
  });

  it("submits a tier-neutral enquiry with the consent snapshot", async () => {
    const response = await route.POST(request(validBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, id: "enquiry_123" });
    expect(submitCoachingEnquiryMock).toHaveBeenCalledWith({
      userId: "user_123",
      applicantName: "Taylor Example",
      applicantEmail: "taylor@example.com",
      consentText: "I consent to this enquiry being processed.",
      answers: {
        support: "Building strength",
        movement: "Two walks each week",
        context: "My capacity changes",
        outcome: "Train more confidently",
        extra: "",
        referral: "Google",
      },
    });
  });

  it("rejects an enquiry without consent before writing data", async () => {
    const response = await route.POST(request({ ...validBody, consent: false }));

    expect(response.status).toBe(400);
    expect(submitCoachingEnquiryMock).not.toHaveBeenCalled();
  });
});
