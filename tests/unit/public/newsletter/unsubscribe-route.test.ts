import { beforeEach, describe, expect, it, vi } from "vitest";

const unsubscribeMarketingEmailByTokenMock = vi.fn();
const requestMarketingUnsubscribeByAddressMock = vi.fn();
const sendMarketingUnsubscribeRequestEmailMock = vi.fn();

vi.mock("@/lib/newsletter/subscriber-service", () => ({
  requestMarketingUnsubscribeByAddress: requestMarketingUnsubscribeByAddressMock,
  unsubscribeMarketingEmailByToken: unsubscribeMarketingEmailByTokenMock,
}));

vi.mock("@/lib/newsletter/unsubscribe-email", () => ({
  sendMarketingUnsubscribeRequestEmail: sendMarketingUnsubscribeRequestEmailMock,
}));

const route = await import("@/app/api/unsubscribe/route");

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = "https://shrutiturner.com";
  });

  it("unsubscribes immediately when given a valid token", async () => {
    unsubscribeMarketingEmailByTokenMock.mockResolvedValue("reader@example.com");

    const response = await route.POST(createRequest({ token: "token_123" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      email: "reader@example.com",
    });
  });

  it("sends a confirmation email when given an address", async () => {
    requestMarketingUnsubscribeByAddressMock.mockResolvedValue({
      email: "reader@example.com",
      token: "token_123",
    });

    const response = await route.POST(createRequest({ email: "reader@example.com" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      requested: true,
      message: "If that email is subscribed, we have sent a secure unsubscribe link.",
    });
    expect(sendMarketingUnsubscribeRequestEmailMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      unsubscribeUrl: "https://shrutiturner.com/unsubscribe?token=token_123",
    });
  });

  it("does not leak whether an email is subscribed", async () => {
    requestMarketingUnsubscribeByAddressMock.mockResolvedValue(null);

    const response = await route.POST(createRequest({ email: "missing@example.com" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      requested: true,
      message: "If that email is subscribed, we have sent a secure unsubscribe link.",
    });
    expect(sendMarketingUnsubscribeRequestEmailMock).not.toHaveBeenCalled();
  });

  it("returns a validation error when no email or token is provided", async () => {
    const response = await route.POST(createRequest({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Provide an email address or unsubscribe token.",
    });
  });

  it("returns not found when the token does not match a subscriber", async () => {
    unsubscribeMarketingEmailByTokenMock.mockRejectedValue(new Error("NOT_FOUND"));

    const response = await route.POST(createRequest({ token: "missing" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "We couldn't find a matching subscriber.",
    });
  });
});
