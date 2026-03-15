import { beforeEach, describe, expect, it, vi } from "vitest";

const saveAuthCodeForEmailMock = vi.fn();
const sendAuthCodeEmailMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();

vi.mock("@/lib/auth-code", () => ({
  generateAuthCode: vi.fn(() => "123456"),
  normalizeEmail: vi.fn((value: string) => value.trim().toLowerCase()),
  saveAuthCodeForEmail: saveAuthCodeForEmailMock,
  sendAuthCodeEmail: sendAuthCodeEmailMock,
}));

vi.mock("@/lib/turnstile", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
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
    verifyTurnstileTokenMock.mockResolvedValue(true);
    saveAuthCodeForEmailMock.mockResolvedValue(undefined);
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
    await expect(response.json()).resolves.toEqual({ message: "Invalid email." });
  });

  it("rejects failed turnstile verification", async () => {
    verifyTurnstileTokenMock.mockResolvedValue(false);

    const response = await route.POST(
      createRequest({
        email: "reader@example.com",
        turnstileToken: "bad-token",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Verification failed. Please try again.",
    });
  });

  it("stores a code and sends the email for a valid request", async () => {
    const response = await route.POST(
      createRequest({
        email: "Reader@Example.com",
        turnstileToken: "token",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(saveAuthCodeForEmailMock).toHaveBeenCalledWith(
      "reader@example.com",
      "123456",
      expect.any(Date)
    );
    expect(sendAuthCodeEmailMock).toHaveBeenCalledWith("reader@example.com", "123456", 10);
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
    await expect(response.json()).resolves.toEqual({ message: "Postmark unavailable" });
  });
});
