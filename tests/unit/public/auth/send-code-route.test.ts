import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const sendAuthCodeEmailMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();
const issueAuthChallengeMock = vi.fn();
const userFindUniqueMock = vi.fn();
const enforceTrustedAuthOriginMock = vi.fn();
const enforceAuthEndpointRateLimitMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/auth-code", () => ({
  sendAuthCodeEmail: sendAuthCodeEmailMock,
}));

vi.mock("@/lib/auth-challenge", () => ({
  issueAuthChallenge: issueAuthChallengeMock,
  normalizeEmail: (value: string) => value.trim().toLowerCase(),
}));

vi.mock("@/lib/auth-security", () => ({
  enforceTrustedAuthOrigin: enforceTrustedAuthOriginMock,
  enforceAuthEndpointRateLimit: enforceAuthEndpointRateLimitMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: userFindUniqueMock,
    },
  },
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: verifyTurnstileTokenMock,
}));

const route = await import("@/app/api/auth/send-code/route");

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/auth/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/send-code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(null);
    verifyTurnstileTokenMock.mockResolvedValue(true);
    userFindUniqueMock.mockResolvedValue({
      id: "user_123",
      deletedAt: null,
    });
    issueAuthChallengeMock.mockResolvedValue({
      ok: true,
      code: "123456",
      expiryMinutes: 10,
      expiresAt: new Date("2026-04-19T12:00:00.000Z"),
    });
    sendAuthCodeEmailMock.mockResolvedValue(undefined);
  });

  it("rejects invalid email addresses", async () => {
    const response = await route.POST(
      createRequest({
        email: "not-an-email",
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Invalid email.",
      },
    });
  });

  it("rejects unknown accounts", async () => {
    userFindUniqueMock.mockResolvedValue(null);

    const response = await route.POST(
      createRequest({
        email: "reader@example.com",
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "No account was found for that email.",
      },
    });
  });

  it("returns a 429 when the resend cooldown is active", async () => {
    issueAuthChallengeMock.mockResolvedValue({
      ok: false,
      retryAfterSeconds: 42,
    });

    const response = await route.POST(
      createRequest({
        email: "reader@example.com",
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Please wait before requesting another code.",
        details: {
          retryAfterSeconds: 42,
        },
      },
    });
  });

  it("issues a code and sends the email for a valid request", async () => {
    const response = await route.POST(
      createRequest({
        email: "Reader@Example.com",
        turnstileToken: "token",
      })
    );

    expect(enforceTrustedAuthOriginMock).toHaveBeenCalledTimes(1);
    expect(enforceAuthEndpointRateLimitMock).toHaveBeenCalledWith({
      route: "send_code",
      email: "reader@example.com",
      requestIp: "",
    });
    expect(issueAuthChallengeMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      userId: "user_123",
      purpose: "login",
      redirectTo: null,
      ip: "",
    });
    expect(sendAuthCodeEmailMock).toHaveBeenCalledWith("reader@example.com", "123456", 10);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        sent: true,
        expiresAt: "2026-04-19T12:00:00.000Z",
        retryAfterSeconds: 0,
      },
    });
  });

  it("returns a 502 when the auth email cannot be sent", async () => {
    sendAuthCodeEmailMock.mockRejectedValue(new Error("Postmark unavailable"));

    const response = await route.POST(
      createRequest({
        email: "reader@example.com",
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "UPSTREAM_FAILURE",
        message: "Postmark unavailable",
      },
    });
  });
});
